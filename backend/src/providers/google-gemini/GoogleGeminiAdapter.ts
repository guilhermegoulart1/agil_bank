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
import { agentConfigs } from '../openrouter/agentConfig.js';

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

      // Get Gemini model with system instructions
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: agentConfig.instructions,
      });

      // Start chat with history
      const chat = model.startChat({
        history: session.history.slice(0, -1), // Exclude last message
      });

      // Send message
      const result = await chat.sendMessage(message);
      totalRequests++;

      const response = result.response;
      const text = response.text();

      // Track usage (Gemini doesn't provide detailed token counts in free tier)
      totalInputTokens += Math.ceil(message.length / 4); // Rough estimate
      totalOutputTokens += Math.ceil(text.length / 4); // Rough estimate

      if (text) {
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

      // For simplicity, Gemini adapter doesn't support tool calling in this version
      // This is a simplified implementation - full tool support would require Gemini function calling

      // Check finish reason
      shouldContinue = false; // Single turn for now

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
