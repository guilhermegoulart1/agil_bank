// Arquivo central de orquestracao dos agentes
// Conecta os handoffs entre os 4 agentes do sistema

import { triageAgent } from './triageAgent.js';
import { creditAgent } from './creditAgent.js';
import { creditInterviewAgent } from './creditInterviewAgent.js';
import { exchangeAgent } from './exchangeAgent.js';

// Triagem → Credito e Cambio (direciona apos autenticacao)
triageAgent.handoffs = [creditAgent, exchangeAgent];

// Credito → Entrevista (quando score insuficiente) e Triagem (fora do escopo)
creditAgent.handoffs = [creditInterviewAgent, triageAgent];

// Entrevista → Credito (apos recalculo do score para nova analise)
creditInterviewAgent.handoffs = [creditAgent];

// Cambio → Triagem (para assuntos fora do escopo de cambio)
exchangeAgent.handoffs = [triageAgent];

export { triageAgent, creditAgent, creditInterviewAgent, exchangeAgent };
export type { BankingContext } from './context.js';

// Mapa de agentes por ID para lookup no endpoint de chat
import type { Agent } from '@openai/agents';
import type { BankingContext } from './context.js';

export const agentMap: Record<string, Agent<BankingContext>> = {
  full: triageAgent,          // Atendimento completo (fluxo orquestrado com todos os handoffs)
  triage: triageAgent,        // Agente de Triagem individual (autenticacao + direcionamento)
  credit: creditAgent,
  'credit-interview': creditInterviewAgent,
  exchange: exchangeAgent,
};
