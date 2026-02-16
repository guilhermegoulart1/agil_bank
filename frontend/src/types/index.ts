// Tipos do frontend

// Mensagem individual no chat
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Estado global do chat
export interface ChatState {
  messages: Message[];
  sessionId: string | null;
  isLoading: boolean;
  logs: LogData[];
}

// Item de log individual retornado pelo backend
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

// Dados de log de uma requisicao
export interface LogData {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  totalTokens: number;
  durationMs: number;
  currentAgent: string;
  contextSnapshot: {
    authenticated?: boolean;
    cpf?: string;
    customerName?: string;
    currentScore?: number;
    currentLimit?: number;
  };
  items: LogItem[];
  timestamp?: string;
}

// Resposta da API do backend
export interface ChatApiResponse {
  sessionId: string;
  messages: string[];
  logs: LogData;
}

// Modo de agente disponivel na sidebar
export interface AgentMode {
  id: string;
  label: string;
  icon: string;
  description: string;
  instructions: string[];
}

// Dados de CSV parseados
export interface CsvData {
  headers: string[];
  rows: string[][];
}

// Estado do visualizador CSV
export interface CsvViewerState {
  activeTab: 'clientes' | 'score_limite' | 'solicitacoes';
  data: Record<string, CsvData | null>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// Tipo de view ativa no painel central
export type ViewType = 'chat' | 'documentation';

// Tipo de tab na documentação
export type DocumentationTab = 'readme' | 'csv';
