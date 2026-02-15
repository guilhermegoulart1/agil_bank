// Ferramenta para processar os dados da entrevista de credito,
// calcular o novo score e atualizar no sistema

import { tool } from '@openai/agents';
import { z } from 'zod';
import type { RunContext } from '@openai/agents';
import type { BankingContext } from '../agents/context.js';
import { calcularScore } from '../services/scoreCalculator.js';
import { csvService } from '../services/csvService.js';

export const realizarEntrevistaTool = tool({
  name: 'realizar_entrevista',
  description: 'Processa os dados coletados na entrevista de credito, calcula o novo score e atualiza no banco de dados do cliente.',
  parameters: z.object({
    rendaMensal: z.number().describe('Renda mensal do cliente em reais'),
    tipoEmprego: z.enum(['formal', 'autonomo', 'desempregado']).describe('Tipo de emprego: formal (CLT), autonomo ou desempregado'),
    despesasFixas: z.number().describe('Total de despesas fixas mensais do cliente em reais'),
    numeroDependentes: z.number().int().min(0).describe('Numero de dependentes do cliente'),
    dividasAtivas: z.boolean().describe('Se o cliente possui dividas ativas (true = sim, false = nao)'),
  }),
  async execute(
    input: {
      rendaMensal: number;
      tipoEmprego: 'formal' | 'autonomo' | 'desempregado';
      despesasFixas: number;
      numeroDependentes: number;
      dividasAtivas: boolean;
    },
    context?: RunContext<BankingContext>
  ): Promise<string> {
    if (!context) return 'Erro interno: contexto nao disponivel.';
    const ctx = context.context;

    if (!ctx.authenticated || !ctx.cpf) {
      return 'Erro: cliente nao autenticado.';
    }

    // Calcula o novo score com base nos dados da entrevista
    const novoScore = calcularScore(input);

    // Salva os dados da entrevista no contexto
    ctx.interviewData = input;

    try {
      // Atualiza o score no CSV de clientes
      await csvService.atualizarScoreCliente(ctx.cpf, novoScore);
      const scoreAnterior = ctx.currentScore;
      ctx.currentScore = novoScore;

      return `Entrevista de credito concluida com sucesso!\n- Score anterior: ${scoreAnterior} pontos\n- Novo score calculado: ${novoScore} pontos\nO score foi atualizado no sistema. Transfira o cliente para o Agente de Credito para uma nova analise de limite.`;
    } catch (erro) {
      console.error('[realizarEntrevista] Erro:', erro);
      return 'Erro ao atualizar o score do cliente no sistema. Tente novamente.';
    }
  },
});
