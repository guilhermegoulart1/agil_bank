// OpenRouter adapter - manual multi-agent orchestration
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import type {
  ProviderAdapter,
  ProviderSession,
  AgentExecutionResult,
  LogItem,
} from '../types.js';
import type { BankingContext } from '../../agents/context.js';
import { toolRegistry, toolsByAgent } from '../tools/registry.js';
import { ToolConverter } from '../tools/ToolConverter.js';
import { agentConfigs } from './agentConfig.js';

export class OpenRouterAdapter implements ProviderAdapter {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, baseUrl = 'https://openrouter.ai/api/v1', model = 'openai/gpt-4o-mini') {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      defaultHeaders: {
        'HTTP-Referer': 'https://banco-agil.com',
        'X-Title': 'Banco Ágil - Desafio Técnico',
      },
    });
    this.model = model;
  }

  async createSession(
    agentId: string,
    initialContext?: Partial<BankingContext>
  ): Promise<ProviderSession> {
    return {
      id: uuidv4(),
      provider: 'openrouter',
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
    session.history.push({ role: 'user', content: message });

    // Multi-turn loop (max 15 turns like @openai/agents)
    const maxTurns = 15;
    let turnCount = 0;
    let shouldContinue = true;

    while (shouldContinue && turnCount < maxTurns) {
      turnCount++;

      const currentAgentId = session.metadata.currentAgentId;
      const agentConfig = agentConfigs[currentAgentId];

      // Prepare messages with system prompt
      const fullMessages = [
        {
          role: 'system' as const,
          content: agentConfig.instructions,
        },
        ...session.history,
      ];

      // Get tools for current agent
      const agentToolNames = toolsByAgent[currentAgentId] || [];
      const agentTools = agentToolNames.map((toolName) => {
        const tool = toolRegistry[toolName as keyof typeof toolRegistry];
        return ToolConverter.toOpenAIFunction(tool);
      });

      // Call OpenRouter
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: fullMessages,
        tools: agentTools.length > 0 ? agentTools : undefined,
        temperature: 0.7,
        max_tokens: 2000,
      });

      totalRequests++;
      totalInputTokens += response.usage?.prompt_tokens || 0;
      totalOutputTokens += response.usage?.completion_tokens || 0;

      const assistantMessage = response.choices[0].message;

      // Handle text response
      if (assistantMessage.content) {
        messages.push(assistantMessage.content);
        session.history.push({
          role: 'assistant',
          content: assistantMessage.content,
        });
        logs.push({
          type: 'message',
          agent: agentConfig.name,
          content: assistantMessage.content,
        });
      }

      // Handle tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls to history
        session.history.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls,
        });

        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = (toolCall as any).function.name;
          const toolInput = JSON.parse((toolCall as any).function.arguments);

          logs.push({
            type: 'tool_call',
            agent: agentConfig.name,
            toolName,
            input: JSON.stringify(toolInput, null, 2),
          });

          // Execute tool with context
          const tool = Object.values(toolRegistry).find((t) => t.name === toolName);
          if (!tool) {
            throw new Error(`Tool not found: ${toolName}`);
          }

          const toolResult = await tool.execute(toolInput, {
            context: session.context,
          });

          logs.push({
            type: 'tool_output',
            toolName,
            output: toolResult,
          });

          // Add tool result to history
          session.history.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          });

          // Check for handoff need based on context changes
          const targetAgent = this.detectHandoff(session.context, currentAgentId);
          if (targetAgent && targetAgent !== currentAgentId) {
            session.metadata.currentAgentId = targetAgent;

            logs.push({
              type: 'handoff',
              sourceAgent: agentConfig.name,
              targetAgent: agentConfigs[targetAgent].name,
            });
          }
        }

        // Continue loop to process tool results
        continue;
      }

      // Check finish reason
      if (response.choices[0].finish_reason === 'stop') {
        shouldContinue = false;
      }

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
   * This is a simplified handoff logic - in @openai/agents this is handled natively
   */
  private detectHandoff(context: BankingContext, currentAgent: string): string | null {
    // Triage → Credit or Exchange after authentication
    if (currentAgent === 'triage' || currentAgent === 'full') {
      if (context.authenticated) {
        // Stay in triage for now - actual handoff would need NLU to detect intent
        // For now, rely on the LLM to use the right tools
        return null;
      }
    }

    // No automatic handoff - rely on natural conversation flow
    // In a production system, you'd implement more sophisticated handoff detection
    return null;
  }

  getProviderName(): string {
    return 'OpenRouter';
  }

  getProviderInfo() {
    return {
      framework: 'OpenAI SDK + OpenRouter',
      model: this.model,
    };
  }
}
