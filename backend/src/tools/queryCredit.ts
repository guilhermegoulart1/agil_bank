// Ferramenta para consultar o limite de credito e score do cliente autenticado

import { tool } from '@openai/agents';
import { z } from 'zod';
import type { RunContext } from '@openai/agents';
import type { BankingContext } from '../agents/context.js';

export const consultarCreditoTool = tool({
  name: 'consultar_credito',
  description: 'Consulta o limite de credito e score atuais do cliente autenticado.',
  parameters: z.object({}),
  async execute(
    _input: Record<string, never>,
    context?: RunContext<BankingContext>
  ): Promise<string> {
    if (!context) return 'Erro interno: contexto nao disponivel.';
    const ctx = context.context;

    if (!ctx.authenticated) {
      return 'Erro: cliente nao autenticado. E necessario autenticar antes de consultar o credito.';
    }

    return `Dados de credito do cliente ${ctx.customerName}:\n- Limite de credito atual: R$ ${ctx.currentLimit?.toLocaleString('pt-BR')}\n- Score de credito: ${ctx.currentScore} pontos (escala de 0 a 1000)`;
  },
});
