import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lockfile from 'proper-lockfile';
import type { ClienteRow, ScoreLimiteRow, SolicitacaoAumentoRow } from '../types/index.js';

// Resolve o diretorio de dados relativo ao arquivo atual
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

class CsvService {
  private clientesPath = path.join(DATA_DIR, 'clientes.csv');
  private scoreLimitePath = path.join(DATA_DIR, 'score_limite.csv');
  private solicitacoesPath = path.join(DATA_DIR, 'solicitacoes_aumento_limite.csv');

  // Le todos os clientes do CSV
  async lerClientes(): Promise<ClienteRow[]> {
    try {
      const conteudo = fs.readFileSync(this.clientesPath, 'utf-8');
      const registros = parse(conteudo, { columns: true, skip_empty_lines: true });
      return registros.map((r: Record<string, string>) => ({
        cpf: r.cpf,
        nome: r.nome,
        dataNascimento: r.data_nascimento,
        scoreCredito: parseInt(r.score_credito, 10),
        limiteCredito: parseFloat(r.limite_credito),
      }));
    } catch (erro) {
      console.error('[CsvService] Erro ao ler clientes.csv:', erro);
      throw new Error('Falha ao acessar banco de dados de clientes.');
    }
  }

  // Le a tabela de faixas de score e limites maximos
  async lerScoreLimite(): Promise<ScoreLimiteRow[]> {
    try {
      const conteudo = fs.readFileSync(this.scoreLimitePath, 'utf-8');
      const registros = parse(conteudo, { columns: true, skip_empty_lines: true });
      return registros.map((r: Record<string, string>) => ({
        scoreMin: parseInt(r.score_min, 10),
        scoreMax: parseInt(r.score_max, 10),
        limiteMaximo: parseFloat(r.limite_maximo),
      }));
    } catch (erro) {
      console.error('[CsvService] Erro ao ler score_limite.csv:', erro);
      throw new Error('Falha ao acessar tabela de score/limite.');
    }
  }

  // Adiciona uma solicitacao de aumento de limite ao CSV
  async adicionarSolicitacao(solicitacao: SolicitacaoAumentoRow): Promise<void> {
    const release = await lockfile.lock(this.solicitacoesPath, { retries: 3 });
    try {
      const linha = stringify([[
        solicitacao.cpfCliente,
        solicitacao.dataHoraSolicitacao,
        solicitacao.limiteAtual,
        solicitacao.novoLimiteSolicitado,
        solicitacao.statusPedido,
      ]]);
      fs.appendFileSync(this.solicitacoesPath, linha);
    } catch (erro) {
      console.error('[CsvService] Erro ao registrar solicitacao:', erro);
      throw new Error('Falha ao registrar solicitacao de aumento.');
    } finally {
      await release();
    }
  }

  // Atualiza o score de credito de um cliente no CSV
  async atualizarScoreCliente(cpf: string, novoScore: number): Promise<void> {
    const release = await lockfile.lock(this.clientesPath, { retries: 3 });
    try {
      const conteudo = fs.readFileSync(this.clientesPath, 'utf-8');
      const registros = parse(conteudo, { columns: true, skip_empty_lines: true });
      const atualizados = registros.map((r: Record<string, string>) => {
        if (r.cpf.replace(/[.\-]/g, '') === cpf.replace(/[.\-]/g, '')) {
          return { ...r, score_credito: novoScore.toString() };
        }
        return r;
      });
      const saida = stringify(atualizados, {
        header: true,
        columns: ['cpf', 'nome', 'data_nascimento', 'score_credito', 'limite_credito'],
      });
      fs.writeFileSync(this.clientesPath, saida);
    } catch (erro) {
      console.error('[CsvService] Erro ao atualizar score:', erro);
      throw new Error('Falha ao atualizar score do cliente.');
    } finally {
      await release();
    }
  }

  // Atualiza o limite de credito de um cliente no CSV
  async atualizarLimiteCliente(cpf: string, novoLimite: number): Promise<void> {
    const release = await lockfile.lock(this.clientesPath, { retries: 3 });
    try {
      const conteudo = fs.readFileSync(this.clientesPath, 'utf-8');
      const registros = parse(conteudo, { columns: true, skip_empty_lines: true });
      const atualizados = registros.map((r: Record<string, string>) => {
        if (r.cpf.replace(/[.\-]/g, '') === cpf.replace(/[.\-]/g, '')) {
          return { ...r, limite_credito: novoLimite.toFixed(2) };
        }
        return r;
      });
      const saida = stringify(atualizados, {
        header: true,
        columns: ['cpf', 'nome', 'data_nascimento', 'score_credito', 'limite_credito'],
      });
      fs.writeFileSync(this.clientesPath, saida);
    } catch (erro) {
      console.error('[CsvService] Erro ao atualizar limite:', erro);
      throw new Error('Falha ao atualizar limite do cliente.');
    } finally {
      await release();
    }
  }

  // Atualiza o status de uma solicitacao de aumento de limite pendente
  async atualizarStatusSolicitacao(cpf: string, novoStatus: 'aprovado' | 'rejeitado'): Promise<void> {
    const release = await lockfile.lock(this.solicitacoesPath, { retries: 3 });
    try {
      const conteudo = fs.readFileSync(this.solicitacoesPath, 'utf-8');
      const registros = parse(conteudo, { columns: true, skip_empty_lines: true });

      // Encontra a ultima solicitacao pendente deste CPF (ordem reversa)
      let indexEncontrado = -1;
      for (let i = registros.length - 1; i >= 0; i--) {
        const r = registros[i] as Record<string, string>;
        if (r.cpf_cliente === cpf && r.status_pedido === 'pendente') {
          indexEncontrado = i;
          break;
        }
      }

      if (indexEncontrado === -1) {
        throw new Error('Nenhuma solicitacao pendente encontrada para este CPF.');
      }

      // Atualiza o status
      const atualizados = registros.map((r: Record<string, string>, idx: number) => {
        if (idx === indexEncontrado) {
          return { ...r, status_pedido: novoStatus };
        }
        return r;
      });

      const saida = stringify(atualizados, {
        header: true,
        columns: ['cpf_cliente', 'data_hora_solicitacao', 'limite_atual', 'novo_limite_solicitado', 'status_pedido'],
      });
      fs.writeFileSync(this.solicitacoesPath, saida);
    } catch (erro) {
      console.error('[CsvService] Erro ao atualizar status da solicitacao:', erro);
      throw new Error('Falha ao atualizar status da solicitacao.');
    } finally {
      await release();
    }
  }
}

export const csvService = new CsvService();
