// Contexto compartilhado entre todos os agentes durante uma sessao de atendimento
// Passado por referencia - alteracoes em um agente/tool sao visiveis em todos os outros

import type { DadosEntrevista } from '../types/index.js';

export interface BankingContext {
  // Estado de autenticacao
  authenticated: boolean;
  authAttempts: number;

  // Dados do cliente (preenchidos apos autenticacao)
  cpf?: string;
  customerName?: string;

  // Dados de credito (preenchidos apos autenticacao)
  currentScore?: number;
  currentLimit?: number;

  // Dados da entrevista (preenchidos durante entrevista de credito)
  interviewData?: DadosEntrevista;

  // Flag para indicar que o atendimento foi encerrado pelo agente
  conversationEnded: boolean;
}
