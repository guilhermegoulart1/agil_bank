// Types for multi-provider support
import type { BankingContext } from '../agents/context.js';

export type ProviderType = 'openai-agents' | 'google-adk' | 'openrouter';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// Log item structure (compatible with existing frontend)
export interface LogItem {
  type: 'message' | 'tool_call' | 'tool_output' | 'handoff';
  agent?: string;
  content?: string;
  toolName?: string;
  input?: string;
  output?: string;
  sourceAgent?: string;
  targetAgent?: string;
}

// Execution result from any provider
export interface AgentExecutionResult {
  messages: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requests: number;
  };
  durationMs: number;
  newHistory: any[];
  lastAgent?: string;
  logs: LogItem[];
}

// Provider session structure
export interface ProviderSession {
  id: string;
  provider: ProviderType;
  agentId: string;
  context: BankingContext;
  history: any[];
  metadata: Record<string, any>;
}

// Provider adapter interface - all providers must implement this
export interface ProviderAdapter {
  createSession(
    agentId: string,
    initialContext?: Partial<BankingContext>
  ): Promise<ProviderSession>;

  executeMessage(
    session: ProviderSession,
    message: string
  ): Promise<AgentExecutionResult>;

  getProviderName(): string;
  getProviderInfo(): { framework: string; model: string };
}
