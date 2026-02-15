// Ferramenta para consultar cotacoes de moedas em tempo real via AwesomeAPI

import { tool } from '@openai/agents';
import { z } from 'zod';
import { exchangeApiService } from '../services/exchangeApiService.js';

export const consultarCambioTool = tool({
  name: 'consultar_cambio',
  description: 'Consulta a cotacao atual de uma moeda estrangeira em relacao ao Real (BRL). Moedas suportadas: USD (Dolar), EUR (Euro), GBP (Libra), ARS (Peso Argentino), CAD (Dolar Canadense), AUD (Dolar Australiano), JPY (Iene), CNY (Yuan), BTC (Bitcoin).',
  parameters: z.object({
    moeda: z.string().describe('Codigo da moeda estrangeira (ex: USD, EUR, GBP, BTC)'),
  }),
  async execute(input: { moeda: string }): Promise<string> {
    const codigo = input.moeda.toUpperCase().trim();

    try {
      const cotacao = await exchangeApiService.buscarCotacao(codigo);

      if (!cotacao) {
        return `Nao foi possivel obter a cotacao para ${codigo}. Verifique se o codigo da moeda esta correto. Moedas suportadas: USD, EUR, GBP, ARS, CAD, AUD, JPY, CNY, BTC.`;
      }

      return `Cotacao ${cotacao.name}:\n- Compra (bid): R$ ${parseFloat(cotacao.bid).toFixed(4)}\n- Venda (ask): R$ ${parseFloat(cotacao.ask).toFixed(4)}\n- Variacao do dia: ${cotacao.pctChange}%\n- Maxima do dia: R$ ${parseFloat(cotacao.high).toFixed(4)}\n- Minima do dia: R$ ${parseFloat(cotacao.low).toFixed(4)}\n- Ultima atualizacao: ${cotacao.createDate}`;
    } catch (erro) {
      console.error('[consultarCambio] Erro:', erro);
      return 'O servico de cotacoes esta indisponivel no momento. Por favor, tente novamente mais tarde.';
    }
  },
});
