// Gerenciador de sessoes de chat em memoria
// Cada sessao mantém o historico de conversa, agente atual e contexto do cliente

import { v4 as uuidv4 } from 'uuid';
import type { Agent, AgentInputItem } from '@openai/agents';
import type { BankingContext } from '../agents/context.js';

export interface Session {
  id: string;
  currentAgent: Agent<BankingContext>;
  inputItems: AgentInputItem[];  // Historico de conversa para o SDK
  context: BankingContext;       // Contexto compartilhado entre agentes
  createdAt: Date;
  lastActivity: Date;
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutos de inatividade

  // Cria uma nova sessao de chat com o agente especificado como ponto de entrada
  // Se contextoInicial for fornecido, usa-o em vez do contexto padrao (util para agentes individuais pre-autenticados)
  createSession(agente: Agent<BankingContext>, contextoInicial?: Partial<BankingContext>): Session {
    const id = uuidv4();
    const session: Session = {
      id,
      currentAgent: agente,
      inputItems: [],
      context: {
        authenticated: false,
        authAttempts: 0,
        conversationEnded: false,
        ...contextoInicial,
      },
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.sessions.set(id, session);
    return session;
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

  // Limpa sessoes expiradas (chamado periodicamente)
  cleanup(): void {
    const agora = Date.now();
    for (const [id, session] of this.sessions) {
      if (agora - session.lastActivity.getTime() > this.TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionManager = new SessionManager();

// Limpeza automatica de sessoes a cada 5 minutos
setInterval(() => sessionManager.cleanup(), 5 * 60 * 1000);
