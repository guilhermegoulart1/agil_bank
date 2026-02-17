// Servico para consulta de cotacoes de cambio com fallback entre APIs

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

// Mapa de nomes das moedas para fallback
const NOMES_MOEDAS: Record<string, string> = {
  USD: 'Dólar Americano/Real Brasileiro',
  EUR: 'Euro/Real Brasileiro',
  GBP: 'Libra Esterlina/Real Brasileiro',
  ARS: 'Peso Argentino/Real Brasileiro',
  CAD: 'Dólar Canadense/Real Brasileiro',
  AUD: 'Dólar Australiano/Real Brasileiro',
  JPY: 'Iene Japonês/Real Brasileiro',
  CNY: 'Yuan Chinês/Real Brasileiro',
  BTC: 'Bitcoin/Real Brasileiro',
};

class ExchangeApiService {
  private readonly TIMEOUT_MS = 10000; // 10s - mais tolerante para servidores fora do Brasil

  // Busca a cotacao de uma moeda em relacao ao BRL
  async buscarCotacao(codigoMoeda: string): Promise<CotacaoMoeda | null> {
    // Tenta AwesomeAPI primeiro, depois fallback para Open Exchange Rates
    const cotacao = await this.tentarAwesomeApi(codigoMoeda);
    if (cotacao) return cotacao;

    console.log(`[ExchangeApi] AwesomeAPI falhou para ${codigoMoeda}, tentando fallback...`);
    return this.tentarFallbackApi(codigoMoeda);
  }

  // API primaria: AwesomeAPI (brasileira, dados completos)
  private async tentarAwesomeApi(codigoMoeda: string): Promise<CotacaoMoeda | null> {
    const par = `${codigoMoeda}-BRL`;
    const url = `https://economia.awesomeapi.com.br/json/last/${par}`;

    try {
      console.log(`[ExchangeApi] Buscando cotacao via AwesomeAPI: ${url}`);
      const resposta = await fetch(url, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });

      if (!resposta.ok) {
        console.error(`[ExchangeApi] AwesomeAPI retornou status ${resposta.status} para ${codigoMoeda}`);
        return null;
      }

      const dados = await resposta.json();
      const chave = `${codigoMoeda}BRL`;
      const cotacao = dados[chave];

      if (!cotacao) {
        console.error(`[ExchangeApi] AwesomeAPI: chave ${chave} nao encontrada na resposta`);
        return null;
      }

      console.log(`[ExchangeApi] AwesomeAPI: cotacao obtida com sucesso para ${codigoMoeda}`);
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
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      console.error(`[ExchangeApi] AwesomeAPI erro para ${codigoMoeda}: ${mensagem}`);
      return null;
    }
  }

  // API de fallback: ExchangeRate-API (global, gratuita, sem chave)
  private async tentarFallbackApi(codigoMoeda: string): Promise<CotacaoMoeda | null> {
    // BTC nao e suportado por essa API
    if (codigoMoeda === 'BTC') {
      return this.tentarFallbackBitcoin();
    }

    const url = `https://open.er-api.com/v6/latest/${codigoMoeda}`;

    try {
      console.log(`[ExchangeApi] Buscando cotacao via ExchangeRate-API: ${url}`);
      const resposta = await fetch(url, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });

      if (!resposta.ok) {
        console.error(`[ExchangeApi] ExchangeRate-API retornou status ${resposta.status}`);
        return null;
      }

      const dados = await resposta.json();

      if (dados.result !== 'success' || !dados.rates?.BRL) {
        console.error('[ExchangeApi] ExchangeRate-API: resposta invalida ou BRL nao encontrado');
        return null;
      }

      const taxaBrl = dados.rates.BRL;
      const agora = new Date().toISOString().replace('T', ' ').substring(0, 19);

      console.log(`[ExchangeApi] ExchangeRate-API: cotacao obtida com sucesso para ${codigoMoeda}`);
      return {
        code: codigoMoeda,
        codein: 'BRL',
        name: NOMES_MOEDAS[codigoMoeda] || `${codigoMoeda}/Real Brasileiro`,
        high: taxaBrl.toFixed(4),
        low: taxaBrl.toFixed(4),
        varBid: '0',
        pctChange: '0',
        bid: taxaBrl.toFixed(4),
        ask: taxaBrl.toFixed(4),
        timestamp: String(Math.floor(Date.now() / 1000)),
        createDate: agora,
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      console.error(`[ExchangeApi] ExchangeRate-API erro para ${codigoMoeda}: ${mensagem}`);
      return null;
    }
  }

  // Fallback especifico para Bitcoin usando CoinGecko
  private async tentarFallbackBitcoin(): Promise<CotacaoMoeda | null> {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true&include_24hr_high_low=true';

    try {
      console.log('[ExchangeApi] Buscando cotacao BTC via CoinGecko');
      const resposta = await fetch(url, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });

      if (!resposta.ok) {
        console.error(`[ExchangeApi] CoinGecko retornou status ${resposta.status}`);
        return null;
      }

      const dados = await resposta.json();
      const btc = dados.bitcoin;

      if (!btc?.brl) {
        console.error('[ExchangeApi] CoinGecko: dados de BTC/BRL nao encontrados');
        return null;
      }

      const agora = new Date().toISOString().replace('T', ' ').substring(0, 19);

      return {
        code: 'BTC',
        codein: 'BRL',
        name: 'Bitcoin/Real Brasileiro',
        high: (btc.brl_24h_high || btc.brl).toFixed(4),
        low: (btc.brl_24h_low || btc.brl).toFixed(4),
        varBid: '0',
        pctChange: (btc.brl_24h_change || 0).toFixed(2),
        bid: btc.brl.toFixed(4),
        ask: btc.brl.toFixed(4),
        timestamp: String(Math.floor(Date.now() / 1000)),
        createDate: agora,
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      console.error(`[ExchangeApi] CoinGecko erro: ${mensagem}`);
      return null;
    }
  }
}

export const exchangeApiService = new ExchangeApiService();
