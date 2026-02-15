// Configuracao dos modos de agente disponiveis na sidebar

import type { AgentMode } from '../types/index.js';

export const agentModes: AgentMode[] = [
  {
    id: 'full',
    label: 'Atendimento Completo',
    icon: '\u{1F3E6}',
    description: 'Fluxo completo com todos os agentes orquestrados',
    instructions: [
      '📋 Como usar: Informe seu CPF e data de nascimento para autenticacao',
      '🔄 Apos autenticado, sera direcionado ao setor adequado automaticamente',
      '✅ Teste: CPF 12345678901 + Data 15/03/1985 → Joao Silva (score 720)',
      '💡 Exemplo: "Ola" → autentica → "Qual meu limite?" → "E a cotacao do dolar?"',
    ],
  },
  {
    id: 'triage',
    label: 'Agente de Triagem',
    icon: '\u{1F6E1}\u{FE0F}',
    description: 'Autentica o cliente e direciona para o agente apropriado',
    instructions: [
      '📋 Como usar: Valida CPF + data de nascimento contra a base de dados',
      '🔄 Permite ate 3 tentativas de autenticacao',
      '✅ Teste 1: CPF 98765432100 + Data 22/07/1990 → Maria Oliveira (score 450)',
      '✅ Teste 2: Errar CPF/data 3 vezes → encerramento automatico',
      '💡 Exemplo: "Preciso de ajuda" → informa CPF → informa data → autenticado',
    ],
  },
  {
    id: 'credit',
    label: 'Agente de Credito',
    icon: '\u{1F4B3}',
    description: 'Informa sobre limites de credito e processa aumento de limite',
    instructions: [
      '🎭 Voce esta autenticado como Joao Silva (demo) - Score 720, Limite R$ 5.000',
      '📋 Como usar: Consulte limite atual ou solicite aumento',
      '✅ Teste 1: "Qual meu limite?" → R$ 5.000 + score 720',
      '✅ Teste 2: "Quero aumentar para 10000" → APROVADO (score 720 permite ate R$ 10k)',
      '✅ Teste 3: "Quero aumentar para 50000" → REJEITADO + oferta de entrevista',
      '💡 Limites por score: 700-799 = max R$ 10.000 | 500-699 = max R$ 5.000',
    ],
  },
  {
    id: 'credit-interview',
    label: 'Entrevista de Credito',
    icon: '\u{1F4CB}',
    description: 'Conduz entrevista financeira para atualizar o score de credito',
    instructions: [
      '🎭 Voce esta autenticado como Joao Silva (demo) - Score atual 720',
      '📋 Como usar: Agente faz 5 perguntas (UMA por vez) sobre sua situacao financeira',
      '✅ Teste: "Quero fazer a entrevista" → responda as perguntas:',
      '   1. Renda mensal: 8000',
      '   2. Tipo emprego: formal',
      '   3. Despesas fixas: 2000',
      '   4. Dependentes: 1',
      '   5. Dividas ativas: nao',
      '💡 Formula: (renda/(despesas+1))*30 + emprego + dependentes + dividas',
      '🔄 Apos entrevista: redireciona para Agente de Credito com novo score',
    ],
  },
  {
    id: 'exchange',
    label: 'Agente de Cambio',
    icon: '\u{1F4B1}',
    description: 'Realiza consulta de cotacao de moedas em tempo real',
    instructions: [
      '🎭 Voce esta autenticado como Joao Silva (demo)',
      '📋 Como usar: Peca cotacao de qualquer moeda suportada',
      '✅ Teste 1: "Qual a cotacao do dolar?" → USD em tempo real (compra/venda/variacao)',
      '✅ Teste 2: "E do euro?" → EUR em tempo real',
      '💡 Moedas: USD, EUR, GBP, ARS, CAD, AUD, JPY, CNY, BTC',
      '🌐 Dados via AwesomeAPI (API brasileira gratuita)',
    ],
  },
];
