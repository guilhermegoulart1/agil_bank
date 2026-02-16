// OpenAI Agents adapter - wraps existing @openai/agents implementation
import { v4 as uuidv4 } from 'uuid';
import { run, type AgentInputItem } from '@openai/agents';
import { agentMap } from '../../agents/index.js';
import type { BankingContext } from '../../agents/context.js';
import type {
  ProviderAdapter,
  ProviderSession,
  AgentExecutionResult,
  LogItem,
} from '../types.js';

export class OpenAIAgentsAdapter implements ProviderAdapter {
  constructor(private apiKey: string) {
    // API key is set globally via setDefaultOpenAIKey in index.ts
    // This constructor exists for consistency with other adapters
  }

  async createSession(
    agentId: string,
    initialContext?: Partial<BankingContext>
  ): Promise<ProviderSession> {
    const agent = agentMap[agentId] || agentMap['full'];

    return {
      id: uuidv4(),
      provider: 'openai-agents',
      agentId,
      context: {
        authenticated: false,
        authAttempts: 0,
        conversationEnded: false,
        ...initialContext,
      },
      history: [],
      metadata: { currentAgent: agent },
    };
  }

  async executeMessage(
    session: ProviderSession,
    message: string
  ): Promise<AgentExecutionResult> {
    const agent = session.metadata.currentAgent;
    const inputItems: AgentInputItem[] = [
      ...session.history,
      { role: 'user', content: message } as AgentInputItem,
    ];

    const startTime = Date.now();

    // Execute agent loop with context
    const result = await run(agent, inputItems, {
      context: session.context,
      maxTurns: 15,
    });

    const durationMs = Date.now() - startTime;

    // Extract messages and build detailed logs
    const messages: string[] = [];
    const logs: LogItem[] = [];

    for (const item of result.newItems) {
      switch (item.type) {
        case 'message_output_item': {
          // Agent text message
          const content = (item as any).content as string;
          if (content) {
            messages.push(content);
            logs.push({
              type: 'message',
              agent: (item as any).agent?.name || 'desconhecido',
              content,
            });
          }
          break;
        }
        case 'tool_call_item': {
          // Tool call
          const rawItem = (item as any).rawItem;
          logs.push({
            type: 'tool_call',
            agent: (item as any).agent?.name || 'desconhecido',
            toolName: rawItem?.name || 'desconhecido',
            input: rawItem?.arguments || '{}',
          });
          break;
        }
        case 'tool_call_output_item': {
          // Tool result
          const output = (item as any).output;
          logs.push({
            type: 'tool_output',
            agent: (item as any).agent?.name || 'desconhecido',
            output: typeof output === 'string' ? output : JSON.stringify(output),
          });
          break;
        }
        case 'handoff_output_item': {
          // Agent handoff
          logs.push({
            type: 'handoff',
            sourceAgent: (item as any).sourceAgent?.name || 'desconhecido',
            targetAgent: (item as any).targetAgent?.name || 'desconhecido',
          });
          break;
        }
      }
    }

    // Update session state
    session.history = result.history;
    if (result.lastAgent) {
      session.metadata.currentAgent = result.lastAgent;
    }

    // Extract token usage
    const usage = result.state.usage;

    return {
      messages,
      usage: {
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        totalTokens: usage?.totalTokens ?? 0,
        requests: usage?.requests ?? 0,
      },
      durationMs,
      newHistory: result.history,
      lastAgent: result.lastAgent?.name,
      logs,
    };
  }

  getProviderName(): string {
    return 'OpenAI Agents Framework';
  }

  getProviderInfo() {
    return {
      framework: '@openai/agents v0.4.6',
      model: 'gpt-4o-mini',
    };
  }
}
