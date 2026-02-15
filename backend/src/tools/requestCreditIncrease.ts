// Ferramenta para solicitar aumento de limite de credito
// Registra primeiro como 'pendente', depois verifica o score e atualiza para 'aprovado' ou 'rejeitado'

import { tool } from '@openai/agents';
import { z } from 'zod';
import type { RunContext } from '@openai/agents';
import type { BankingContext } from '../agents/context.js';
import { csvService } from '../services/csvService.js';

export const solicitarAumentoLimiteTool = tool({
  name: 'solicitar_aumento_limite',
  description: 'Solicita aumento do limite de credito. Primeiro registra a solicitacao, depois verifica se o score atual do cliente permite o novo limite desejado e atualiza o status.',
  parameters: z.object({
    novoLimite: z.number().describe('Novo limite de credito desejado pelo cliente em reais'),
  }),
  async execute(
    input: { novoLimite: number },
    context?: RunContext<BankingContext>
  ): Promise<string> {
    if (!context) return 'Erro interno: contexto nao disponivel.';
    const ctx = context.context;

    if (!ctx.authenticated || !ctx.cpf || ctx.currentScore === undefined || ctx.currentLimit === undefined) {
      return 'Erro: cliente nao autenticado ou dados incompletos.';
    }

    try {
      // Passo 1: Registra a solicitacao com status 'pendente'
      await csvService.adicionarSolicitacao({
        cpfCliente: ctx.cpf,
        dataHoraSolicitacao: new Date().toISOString(),
        limiteAtual: ctx.currentLimit,
        novoLimiteSolicitado: input.novoLimite,
        statusPedido: 'pendente',
      });

      // Passo 2: Consulta a tabela de faixas de score para verificar o limite maximo permitido
      const faixasScore = await csvService.lerScoreLimite();
      const faixaCliente = faixasScore.find(
        (faixa) => ctx.currentScore! >= faixa.scoreMin && ctx.currentScore! <= faixa.scoreMax
      );

      const limiteMaximoPermitido = faixaCliente?.limiteMaximo ?? 0;
      const status: 'aprovado' | 'rejeitado' = input.novoLimite <= limiteMaximoPermitido ? 'aprovado' : 'rejeitado';

      // Passo 3: Atualiza o status da solicitacao de 'pendente' para 'aprovado' ou 'rejeitado'
      await csvService.atualizarStatusSolicitacao(ctx.cpf, status);

      if (status === 'aprovado') {
        // Atualiza o limite no CSV do cliente
        await csvService.atualizarLimiteCliente(ctx.cpf, input.novoLimite);
        ctx.currentLimit = input.novoLimite;
        return `Solicitacao APROVADA! O novo limite de credito do cliente e R$ ${input.novoLimite.toLocaleString('pt-BR')}. O limite foi atualizado no sistema.`;
      } else {
        return `Solicitacao REJEITADA. O score atual do cliente (${ctx.currentScore} pontos) permite um limite maximo de R$ ${limiteMaximoPermitido.toLocaleString('pt-BR')}, mas o cliente solicitou R$ ${input.novoLimite.toLocaleString('pt-BR')}. Informe o cliente e ofereca a opcao de realizar uma Entrevista de Credito para tentar melhorar o score.`;
      }
    } catch (erro) {
      console.error('[solicitarAumentoLimite] Erro:', erro);
      return 'Erro ao processar a solicitacao de aumento de limite. Tente novamente.';
    }
  },
});
