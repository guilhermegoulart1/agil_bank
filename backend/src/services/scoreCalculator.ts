// Calculadora de score de credito baseada na entrevista financeira
// Formula: score = (renda/(despesas+1))*30 + peso_emprego + peso_dependentes + peso_dividas

import type { DadosEntrevista } from '../types/index.js';

// Pesos por tipo de emprego
const PESO_EMPREGO: Record<string, number> = {
  formal: 300,
  autonomo: 200,
  desempregado: 0,
};

// Retorna o peso baseado no numero de dependentes
function pesoDependentes(quantidade: number): number {
  if (quantidade === 0) return 100;
  if (quantidade === 1) return 80;
  if (quantidade === 2) return 60;
  return 30; // 3 ou mais
}

// Retorna o peso baseado na existencia de dividas
function pesoDividas(temDividas: boolean): number {
  return temDividas ? -100 : 100;
}

// Calcula o score de credito (0 a 1000) com base nos dados da entrevista
export function calcularScore(dados: DadosEntrevista): number {
  const razaoRenda = (dados.rendaMensal / (dados.despesasFixas + 1)) * 30;
  const pontuacaoEmprego = PESO_EMPREGO[dados.tipoEmprego] ?? 0;
  const pontuacaoDependentes = pesoDependentes(dados.numeroDependentes);
  const pontuacaoDividas = pesoDividas(dados.dividasAtivas);

  const scoreTotal = razaoRenda + pontuacaoEmprego + pontuacaoDependentes + pontuacaoDividas;

  // Limita o score entre 0 e 1000
  return Math.max(0, Math.min(1000, Math.round(scoreTotal)));
}
