// Google Gemini adapter - manual multi-agent orchestration using Gemini API
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ProviderAdapter,
  ProviderSession,
  AgentExecutionResult,
  LogItem,
} from '../types.js';
import type { BankingContext } from '../../agents/context.js';
import { toolRegistry, toolsByAgent } from '../tools/registry.js';
import { agentConfigs } from './agentConfig.js';

export class GoogleGeminiAdapter implements ProviderAdapter {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async createSession(
    agentId: string,
    initialContext?: Partial<BankingContext>
  ): Promise<ProviderSession> {
    return {
      id: uuidv4(),
      provider: 'google-adk',
      agentId,
      context: {
        authenticated: false,
        authAttempts: 0,
        conversationEnded: false,
        ...initialContext,
      },
      history: [],
      metadata: {
        currentAgentId: agentId,
        turnCount: 0,
      },
    };
  }

  /**
   * Converts universal tool schemas to Gemini FunctionDeclaration format
   */
  private getGeminiFunctionDeclarations(agentId: string) {
    const agentToolNames = toolsByAgent[agentId] || [];
    return agentToolNames.map((toolName) => {
      const tool = toolRegistry[toolName as keyof typeof toolRegistry];
      // tool.schema is already JSON Schema (converted by @openai/agents)
      const jsonSchema = { ...tool.schema } as Record<string, any>;
      // Remove fields that Gemini doesn't accept
      delete jsonSchema.$schema;
      delete jsonSchema.additionalProperties;
      return {
        name: tool.name,
        description: tool.description,
        parameters: jsonSchema,
      };
    });
  }

  async executeMessage(
    session: ProviderSession,
    message: string
  ): Promise<AgentExecutionResult> {
    const messages: string[] = [];
    const logs: LogItem[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalRequests = 0;

    const startTime = Date.now();

    // Add user message to history
    session.history.push({ role: 'user', parts: [{ text: message }] });

    // Multi-turn loop (max 15 turns)
    const maxTurns = 15;
    let turnCount = 0;
    let shouldContinue = true;

    while (shouldContinue && turnCount < maxTurns) {
      turnCount++;

      const currentAgentId = session.metadata.currentAgentId;
      const agentConfig = agentConfigs[currentAgentId];

      // Get function declarations for current agent
      const functionDeclarations = this.getGeminiFunctionDeclarations(currentAgentId);

      // Create Gemini model with system instructions and tools
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: agentConfig.instructions,
        tools: functionDeclarations.length > 0
          ? [{ functionDeclarations }] as any
          : undefined,
      });

      // Start chat with history (exclude last entry which we'll send)
      const chat = model.startChat({
        history: session.history.slice(0, -1),
      });

      // Send the last history entry
      const lastEntry = session.history[session.history.length - 1];
      let result = await chat.sendMessage(lastEntry.parts);
      totalRequests++;

      // Track usage
      if (result.response.usageMetadata) {
        totalInputTokens += result.response.usageMetadata.promptTokenCount || 0;
        totalOutputTokens += result.response.usageMetadata.candidatesTokenCount || 0;
      }

      // Inner loop for handling function calls (tool use)
      let processingTools = true;
      while (processingTools) {
        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];
        const functionCallParts = parts.filter((p: any) => p.functionCall);
        const textParts = parts.filter((p: any) => p.text);

        if (functionCallParts.length > 0) {
          // Log any text that comes alongside function calls
          if (textParts.length > 0) {
            const text = textParts.map((p: any) => p.text).join('');
            messages.push(text);
            logs.push({
              type: 'message',
              agent: agentConfig.name,
              content: text,
            });
          }

          // Add model's full response (with function calls) to session history
          session.history.push({
            role: 'model',
            parts: parts,
          });

          // Execute each function call and collect responses
          const functionResponses: any[] = [];
          for (const part of functionCallParts) {
            const fc = (part as any).functionCall;
            const toolName: string = fc.name;
            const toolArgs = fc.args || {};

            logs.push({
              type: 'tool_call',
              agent: agentConfig.name,
              toolName,
              input: JSON.stringify(toolArgs, null, 2),
            });

            // Find tool in registry by name
            const tool = Object.values(toolRegistry).find((t) => t.name === toolName);
            if (!tool) {
              throw new Error(`Tool not found: ${toolName}`);
            }

            // Execute tool with banking context
            const toolResult = await tool.execute(toolArgs, {
              context: session.context,
            });

            logs.push({
              type: 'tool_output',
              toolName,
              output: toolResult,
            });

            functionResponses.push({
              functionResponse: {
                name: toolName,
                response: { result: toolResult },
              },
            });
          }

          // Add function responses to session history
          session.history.push({
            role: 'user',
            parts: functionResponses,
          });

          // Send function responses back to model via same chat
          result = await chat.sendMessage(functionResponses);
          totalRequests++;

          // Track usage for this round
          if (result.response.usageMetadata) {
            totalInputTokens += result.response.usageMetadata.promptTokenCount || 0;
            totalOutputTokens += result.response.usageMetadata.candidatesTokenCount || 0;
          }

          // Check for handoff based on context changes
          const targetAgent = this.detectHandoff(session.context, currentAgentId);
          if (targetAgent && targetAgent !== currentAgentId) {
            session.metadata.currentAgentId = targetAgent;
            logs.push({
              type: 'handoff',
              sourceAgent: agentConfig.name,
              targetAgent: agentConfigs[targetAgent].name,
            });
          }

          // Continue inner loop to check if model needs more tool calls
          continue;
        }

        // No function calls - process text response
        if (textParts.length > 0) {
          const text = textParts.map((p: any) => p.text).join('');
          messages.push(text);
          session.history.push({
            role: 'model',
            parts: [{ text }],
          });
          logs.push({
            type: 'message',
            agent: agentConfig.name,
            content: text,
          });
        }

        // Exit inner function-call loop
        processingTools = false;
      }

      // Single outer turn for now
      shouldContinue = false;

      // Prevent infinite loops
      if (turnCount >= maxTurns) {
        shouldContinue = false;
      }
    }

    return {
      messages,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        requests: totalRequests,
      },
      durationMs: Date.now() - startTime,
      newHistory: session.history,
      lastAgent: agentConfigs[session.metadata.currentAgentId].name,
      logs,
    };
  }

  /**
   * Detects when to handoff to another agent based on context changes
   */
  private detectHandoff(context: BankingContext, currentAgent: string): string | null {
    if (currentAgent === 'triage' || currentAgent === 'full') {
      if (context.authenticated) {
        return null;
      }
    }
    return null;
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  getProviderInfo() {
    return {
      framework: '@google/generative-ai',
      model: this.model,
    };
  }
}
