// Ferramenta para validar CPF e data de nascimento do cliente contra o CSV

import { tool } from '@openai/agents';
import { z } from 'zod';
import type { RunContext } from '@openai/agents';
import type { BankingContext } from '../agents/context.js';
import { csvService } from '../services/csvService.js';

export const validarClienteTool = tool({
  name: 'validar_cliente',
  description: 'Valida o CPF e data de nascimento do cliente contra o banco de dados para autenticacao. Retorna se o cliente foi autenticado e seus dados.',
  parameters: z.object({
    cpf: z.string().describe('CPF do cliente (apenas numeros ou formatado com pontos e traco)'),
    dataNascimento: z.string().describe('Data de nascimento do cliente no formato DD/MM/AAAA'),
  }),
  async execute(
    input: { cpf: string; dataNascimento: string },
    context?: RunContext<BankingContext>
  ): Promise<string> {
    if (!context) return 'Erro interno: contexto nao disponivel.';
    const ctx = context.context;

    // Incrementa tentativas de autenticacao
    ctx.authAttempts += 1;

    // Normaliza CPF removendo pontos e tracos
    const cpfNormalizado = input.cpf.replace(/[.\-]/g, '');

    try {
      const clientes = await csvService.lerClientes();
      const cliente = clientes.find(
        (c) =>
          c.cpf.replace(/[.\-]/g, '') === cpfNormalizado &&
          c.dataNascimento === input.dataNascimento
      );

      if (cliente) {
        // Autenticacao bem-sucedida - salva dados no contexto
        ctx.authenticated = true;
        ctx.cpf = cliente.cpf;
        ctx.customerName = cliente.nome;
        ctx.currentScore = cliente.scoreCredito;
        ctx.currentLimit = cliente.limiteCredito;

        return `Cliente autenticado com sucesso. Nome: ${cliente.nome}. Limite de credito atual: R$ ${cliente.limiteCredito.toLocaleString('pt-BR')}. Score de credito: ${cliente.scoreCredito}.`;
      } else {
        const tentativasRestantes = 3 - ctx.authAttempts;
        if (tentativasRestantes <= 0) {
          return 'Autenticacao falhou. Numero maximo de tentativas atingido (3). Encerre a conversa educadamente informando que nao foi possivel autenticar o cliente.';
        }
        return `Dados nao conferem com nosso banco de dados. O cliente ainda tem ${tentativasRestantes} tentativa(s) restante(s).`;
      }
    } catch (erro) {
      console.error('[validarCliente] Erro:', erro);
      return 'Erro ao acessar o banco de dados de clientes. Por favor, tente novamente mais tarde.';
    }
  },
});
