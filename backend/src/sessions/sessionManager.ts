// Gerenciador de sessoes de chat em memoria com suporte multi-provider
// Cada sessao mantém o provider adapter, historico de conversa e contexto do cliente

import { ProviderFactory } from '../providers/ProviderFactory.js';
import type { ProviderAdapter, ProviderSession, ProviderType } from '../providers/types.js';
import type { BankingContext } from '../agents/context.js';
import { config } from '../config/env.js';

export interface Session {
  id: string;
  provider: ProviderAdapter;
  providerSession: ProviderSession;
  createdAt: Date;
  lastActivity: Date;
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutos de inatividade
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup automatico de sessoes a cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // Cria uma nova sessao de chat com o provider especificado
  async createSession(
    agentId: string,
    contextoInicial?: Partial<BankingContext>,
    providerType?: ProviderType,
    model?: string
  ): Promise<Session> {
    // Determine which provider to use
    const type = providerType || config.provider.default;

    // Get API key for provider
    const apiKey = this.getApiKeyForProvider(type);

    if (!apiKey) {
      throw new Error(`No API key configured for provider: ${type}`);
    }

    const providerConfig = {
      type,
      apiKey,
      baseUrl: type === 'openrouter' ? config.provider.openrouterBaseUrl : undefined,
      model: type === 'openrouter' ? (model || config.provider.openrouterModel) : undefined,
    };

    const provider = ProviderFactory.createProvider(providerConfig);
    const providerSession = await provider.createSession(agentId, contextoInicial);

    const session: Session = {
      id: providerSession.id,
      provider,
      providerSession,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private getApiKeyForProvider(type: ProviderType): string {
    switch (type) {
      case 'openai-agents':
        return config.provider.openaiApiKey;
      case 'google-adk':
        return config.provider.googleApiKey;
      case 'openrouter':
        return config.provider.openrouterApiKey;
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  // Recupera uma sessao existente pelo ID
  getSession(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  // Remove uma sessao
  deleteSession(id: string): void {
    this.sessions.delete(id);
  }

  // Limpa sessoes expiradas
  cleanup(): void {
    const agora = Date.now();
    for (const [id, session] of this.sessions) {
      if (agora - session.lastActivity.getTime() > this.TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  // Destroi o manager e para o cleanup
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

export const sessionManager = new SessionManager();
