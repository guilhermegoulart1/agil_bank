// Ferramenta para encerrar o atendimento
// Marca a conversa como finalizada e retorna mensagem de despedida

import { tool } from '@openai/agents';
import { z } from 'zod';
import type { RunContext } from '@openai/agents';
import type { BankingContext } from '../agents/context.js';

export const encerrarAtendimentoTool = tool({
  name: 'encerrar_atendimento',
  description: 'Encerra o atendimento ao cliente de forma definitiva. Use quando o cliente solicitar o fim da conversa ou quando o atendimento nao puder continuar (ex: 3 falhas de autenticacao).',
  parameters: z.object({
    mensagemDespedida: z.string().default('').describe('Mensagem personalizada de despedida para o cliente (opcional)'),
  }),
  async execute(
    input: { mensagemDespedida: string },
    context?: RunContext<BankingContext>
  ): Promise<string> {
    if (!context) return 'Erro interno: contexto nao disponivel.';
    const ctx = context.context;

    // Marca a conversa como encerrada
    ctx.conversationEnded = true;

    // Mensagem padrao ou personalizada
    const mensagem = input.mensagemDespedida && input.mensagemDespedida.trim()
      ? input.mensagemDespedida
      : 'Obrigado por utilizar os servicos do Banco Agil. Tenha um otimo dia!';

    return `${mensagem}\n\n[ATENDIMENTO ENCERRADO]`;
  },
});
