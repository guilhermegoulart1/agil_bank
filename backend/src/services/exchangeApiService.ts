// Servico para consulta de cotacoes de cambio via AwesomeAPI

interface CotacaoMoeda {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  createDate: string;
}

class ExchangeApiService {
  private baseUrl = 'https://economia.awesomeapi.com.br';

  // Busca a cotacao de uma moeda em relacao ao BRL
  async buscarCotacao(codigoMoeda: string): Promise<CotacaoMoeda | null> {
    const par = `${codigoMoeda}-BRL`;
    const url = `${this.baseUrl}/json/last/${par}`;

    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resposta.ok) return null;

      const dados = await resposta.json();
      const chave = `${codigoMoeda}BRL`;
      const cotacao = dados[chave];

      if (!cotacao) return null;

      return {
        code: cotacao.code,
        codein: cotacao.codein,
        name: cotacao.name,
        high: cotacao.high,
        low: cotacao.low,
        varBid: cotacao.varBid,
        pctChange: cotacao.pctChange,
        bid: cotacao.bid,
        ask: cotacao.ask,
        timestamp: cotacao.timestamp,
        createDate: cotacao.create_date,
      };
    } catch (erro) {
      console.error('[ExchangeApi] Erro ao buscar cotacao:', erro);
      return null;
    }
  }
}

export const exchangeApiService = new ExchangeApiService();
