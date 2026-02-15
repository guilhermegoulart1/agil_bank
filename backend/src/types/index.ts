// Tipos compartilhados do backend

// Registro de cliente do CSV
export interface ClienteRow {
  cpf: string;
  nome: string;
  dataNascimento: string;
  scoreCredito: number;
  limiteCredito: number;
}

// Faixa de score e limite maximo permitido
export interface ScoreLimiteRow {
  scoreMin: number;
  scoreMax: number;
  limiteMaximo: number;
}

// Registro de solicitacao de aumento de limite
export interface SolicitacaoAumentoRow {
  cpfCliente: string;
  dataHoraSolicitacao: string;
  limiteAtual: number;
  novoLimiteSolicitado: number;
  statusPedido: string;
}

// Dados coletados na entrevista de credito
export interface DadosEntrevista {
  rendaMensal: number;
  tipoEmprego: 'formal' | 'autonomo' | 'desempregado';
  despesasFixas: number;
  numeroDependentes: number;
  dividasAtivas: boolean;
}
