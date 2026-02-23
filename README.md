# Banco Agil - Agente Bancario Inteligente

Sistema de atendimento ao cliente para o banco digital **Banco Agil**, construido com agentes de IA especializados que se comunicam de forma transparente ao usuario.

## Visao Geral

O Banco Agil e um sistema multi-agente onde 4 agentes de IA especializados colaboram para atender o cliente de forma inteligente e contextual. O sistema utiliza uma **arquitetura multi-provider** que suporta **OpenAI Agents SDK**, **Google Gemini** e **OpenRouter** (100+ modelos) para orquestrar as transicoes (handoffs) entre agentes de forma transparente - para o cliente, a experiencia e de conversar com um unico assistente. O provider pode ser escolhido dinamicamente via interface, variavel de ambiente ou request.

### Funcionalidades

#### Funcionalidades dos Agentes
- **Autenticacao de cliente** via CPF e data de nascimento (com 3 tentativas)
- **Consulta de limite de credito** do cliente autenticado
- **Solicitacao de aumento de limite** com verificacao automatica de score (fluxo: pendente → aprovado/rejeitado)
- **Entrevista de credito** conversacional para recalcular o score (1 pergunta por vez)
- **Consulta de cotacoes de cambio** em tempo real (USD, EUR, GBP, ARS, BTC, etc.)
- **Transicoes transparentes** entre agentes especializados (handoffs automaticos)
- **Encerramento de conversa** programatico via tool call (requisito do desafio)
- **Tratamento de erros** amigavel em todas as etapas

#### Funcionalidades da Interface
- **Sidebar com selecao de agentes**: escolha entre atendimento completo (orquestrado) ou agentes individuais
- **5 modos de operacao**:
  - Atendimento Completo: fluxo com todos os agentes trabalhando juntos
  - Agente de Triagem: autenticacao e direcionamento (standalone)
  - Agente de Credito: consulta e aumento de limite (pre-autenticado em modo demo)
  - Entrevista de Credito: recalculo de score (pre-autenticado em modo demo)
  - Agente de Cambio: cotacoes em tempo real (pre-autenticado em modo demo)
- **Painel de logs detalhados** (toggleavel):
  - Contagem de tokens (input, output, total, requests)
  - Duracao de cada request (em ms)
  - Historico completo de tool calls (nome da tool + input JSON)
  - Resultados das tools (outputs formatados)
  - Handoffs entre agentes (source → target)
  - Snapshot do contexto da sessao (CPF, score, limite, etc.)
  - Fundo preto, fonte monospace, super detalhado
- **Chat profissional** com visual bancario moderno (azul escuro + teal)

## Arquitetura do Sistema

### Stack Tecnologica

| Camada | Tecnologia | Detalhes |
|--------|-----------|----------|
| Backend | Node.js + TypeScript + Express | API REST na porta 3001 |
| Agentes IA | **Multi-provider** (3 opcoes) | OpenAI Agents SDK, Google Gemini, OpenRouter |
| Modelo LLM | GPT-4o-mini, Gemini 2.0 Flash, 100+ modelos | Selecionavel via UI, env ou request |
| Frontend | React 19 + TypeScript + Vite | SPA com 3 paineis (sidebar, chat, logs) |
| APIs de Cotacao | AwesomeAPI + ExchangeRate-API + CoinGecko | Fallback automatico entre 3 APIs |
| Dados | CSV com file locking (`proper-lockfile`) | clientes, scores, solicitacoes |
| Deploy | Railway | Backend + Frontend como servicos separados |

#### AI Providers Disponiveis

| Provider | Framework | Modelo | Custo | Handoffs |
|----------|-----------|--------|-------|----------|
| **OpenAI Agents SDK** | `@openai/agents` v0.4.6 | gpt-4o-mini | ~$0.15/1M tokens | Nativos (SDK) |
| **Google Gemini** | `@google/generative-ai` | gemini-2.0-flash-exp | **GRATUITO** | Orquestrados manualmente |
| **OpenRouter** | OpenAI SDK + OpenRouter API | 100+ modelos (GPT, Claude, Llama, Mistral, etc.) | Varia por modelo | Orquestrados manualmente |

#### APIs de Cotacao (com Fallback)

| Prioridade | API | Cobertura | Autenticacao | Observacao |
|------------|-----|-----------|-------------|------------|
| 1 (primaria) | **AwesomeAPI** | Moedas tradicionais + BTC | Nenhuma | Dados completos (bid/ask/variacao/max/min). Pode retornar HTTP 429 em IPs de datacenter fora do Brasil |
| 2 (fallback) | **ExchangeRate-API** | Moedas tradicionais | Nenhuma | API global, funciona de qualquer regiao/datacenter |
| 3 (fallback BTC) | **CoinGecko** | Criptomoedas | Nenhuma | Usada quando as anteriores falham para Bitcoin |

### Agentes do Sistema

```
                    ┌─────────────────────┐
                    │  Agente de Triagem   │
                    │  (ponto de entrada)  │
                    └───┬─────────┬───────┘
                        │         │
               autenticado   autenticado
               + credito     + cambio
                        │         │
            ┌───────────┘         └──────────┐
            ▼                                ▼
   ┌──────────────────┐           ┌───────────────────┐
   │ Agente de Credito│           │ Agente de Cambio  │
   └────────┬─────────┘           └───────────────────┘
            │
            │ rejeitado + aceita
            │ entrevista
            ▼
   ┌────────────────────────┐
   │ Agente de Entrevista   │
   │ de Credito             │
   └──────────┬─────────────┘
              │ score atualizado
              ▼
   ┌──────────────────┐
   │ Agente de Credito│  (re-analise)
   └──────────────────┘
```

#### 1. Agente de Triagem
- Recepciona o cliente e coleta CPF + data de nascimento
- Valida contra a base de dados (`clientes.csv`)
- Permite ate 3 tentativas de autenticacao
- Direciona para o agente apropriado apos autenticacao

#### 2. Agente de Credito
- Consulta limite de credito atual
- Processa solicitacoes de aumento de limite
- Verifica score vs tabela `score_limite.csv`
- Registra solicitacoes em `solicitacoes_aumento_limite.csv`
- Oferece entrevista de credito quando limite e rejeitado

#### 3. Agente de Entrevista de Credito
- Conduz entrevista financeira (renda, emprego, despesas, dependentes, dividas)
- Calcula novo score usando formula ponderada (0-1000)
- Atualiza score no sistema
- Redireciona para re-analise de credito

#### 4. Agente de Cambio
- Consulta cotacoes em tempo real com **fallback automatico entre 3 APIs**
- API primaria: AwesomeAPI (dados completos com bid/ask, variacao, max/min)
- Fallback moedas: ExchangeRate-API (global, funciona de qualquer datacenter)
- Fallback Bitcoin: CoinGecko (cotacao BTC/BRL com variacao 24h)
- Suporta: USD, EUR, GBP, ARS, CAD, AUD, JPY, CNY, BTC
- Timeout de 10s por API (tolerante a latencia cross-region)
- Logs detalhados de qual API foi utilizada em cada consulta

### Sistema Multi-Provider

O sistema suporta **3 providers de IA diferentes**, permitindo flexibilidade, comparação de performance e otimização de custos:

#### Providers Implementados

1. **OpenAI Agents SDK** (baseline)
   - Framework oficial da OpenAI com handoffs nativos
   - Modelo: `gpt-4o-mini`
   - Orquestração automática via SDK

2. **Google Gemini** (gratuito!)
   - SDK: `@google/generative-ai`
   - Modelo: `gemini-2.0-flash-exp`
   - Orquestração manual
   - **API gratuita** com limites generosos

3. **OpenRouter** (máxima flexibilidade)
   - Acesso a **100+ modelos** (GPT, Claude, Llama, Mistral, etc.)
   - Orquestração manual via OpenAI SDK
   - Escolha de modelo customizável
   - Otimização de custo por tarefa

#### Tabela Comparativa dos Providers

| Aspecto | OpenAI Agents | Google Gemini | OpenRouter |
|---------|---------------|---------------|------------|
| **Framework** | `@openai/agents` v0.4.6 | `@google/generative-ai` | OpenAI SDK + OpenRouter API |
| **Handoffs** | ✅ Nativos (SDK) | ⚠️ Manual (orquestrado) | ⚠️ Manual (orquestrado) |
| **Modelo(s)** | gpt-4o-mini | gemini-2.0-flash-exp | 100+ modelos disponíveis |
| **Custo** | $$ (~$0.15/1M tokens) | **GRÁTIS** (até limite) | $ - $$$ (varia por modelo) |
| **Velocidade** | ⚡ Rápida (~2-3s) | ⚡⚡ Muito rápida (~1-2s) | ⚡ Rápida (varia) |
| **Complexidade** | 🟢 Baixa (SDK abstrai) | 🟡 Média (orquestração manual) | 🟡 Média (orquestração manual) |
| **Tool Calling** | ✅ Nativo | ✅ Suportado | ✅ Nativo (OpenAI format) |
| **Contexto** | Compartilhado (referência) | Mantido manualmente | Mantido manualmente |
| **Rate Limits** | Médios (tier-based) | Generosos (free tier) | Altos (pagos) |
| **Setup** | Chave OpenAI | Chave Google (gratuita) | Chave OpenRouter |

#### Prós e Contras de Cada Provider

**OpenAI Agents SDK**
- ✅ **Prós:**
  - Handoffs nativos e automáticos
  - Documentação oficial excelente
  - Contexto compartilhado por referência
  - Implementação mais simples
  - Maturidade e estabilidade
- ❌ **Contras:**
  - Custo por token (não gratuito)
  - Dependência exclusiva do OpenAI
  - Vendor lock-in
  - Menos controle sobre orquestração

**Google Gemini**
- ✅ **Prós:**
  - **Completamente gratuito** (até rate limits)
  - Muito rápido (gemini-2.0-flash)
  - Boa qualidade de respostas
  - API simples e bem documentada
  - Alternativa sem custo
- ❌ **Contras:**
  - Handoffs devem ser orquestrados manualmente
  - Menor maturidade que OpenAI
  - Rate limits no tier gratuito
  - Tracking de tokens aproximado

**OpenRouter**
- ✅ **Prós:**
  - **100+ modelos disponíveis** (GPT, Claude, Llama, Mistral, Qwen, etc.)
  - Otimização de custo (modelos baratos disponíveis)
  - Flexibilidade máxima
  - Comparação entre modelos
  - Fallback entre providers
  - Rate limits altos
- ❌ **Contras:**
  - Handoffs devem ser orquestrados manualmente
  - Custo varia muito por modelo
  - Necessita gerenciamento de créditos
  - Qualidade varia entre modelos

#### Quando Usar Cada Provider?

| Cenário | Provider Recomendado | Justificativa |
|---------|---------------------|---------------|
| **Desenvolvimento e testes** | Google Gemini | Gratuito, rápido, sem custo |
| **Produção com orçamento** | Google Gemini | Tier gratuito suficiente para volume médio |
| **Produção enterprise** | OpenAI Agents | Handoffs nativos, estabilidade, suporte |
| **Comparação de modelos** | OpenRouter | Acesso a múltiplos providers |
| **Otimização de custo** | OpenRouter | Modelos baratos (ex: Llama 3.1 70B) |
| **Máxima confiabilidade** | OpenAI Agents | Maturidade e SLA |
| **Experimentação** | OpenRouter | Testar Claude, Mistral, etc. |

#### Arquitetura Multi-Provider

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                   │
│  ┌──────────────────────────────────────────┐  │
│  │      ProviderSelector Component          │  │
│  │  [OpenAI Agents] [Gemini] [OpenRouter]  │  │
│  └──────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ POST /api/chat
                     │ { message, provider }
                     ▼
┌─────────────────────────────────────────────────┐
│          Backend (Express + TypeScript)         │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │        ProviderFactory                   │  │
│  │     (createProvider based on type)       │  │
│  └─────┬──────────┬──────────────┬──────────┘  │
│        │          │              │             │
│        ▼          ▼              ▼             │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐    │
│  │ OpenAI  │ │ Google  │ │  OpenRouter  │    │
│  │Adapter  │ │Adapter  │ │   Adapter    │    │
│  └────┬────┘ └────┬────┘ └──────┬───────┘    │
│       │           │              │            │
└───────┼───────────┼──────────────┼────────────┘
        │           │              │
        ▼           ▼              ▼
    ┌────────┐  ┌────────┐  ┌──────────────┐
    │OpenAI  │  │Google  │  │  OpenRouter  │
    │  API   │  │Gemini  │  │     API      │
    │        │  │  API   │  │ (100+ models)│
    └────────┘  └────────┘  └──────────────┘
```

#### Padrão Adapter

Todos os providers implementam a interface `ProviderAdapter`:

```typescript
interface ProviderAdapter {
  createSession(agentId: string, context?: BankingContext): Promise<ProviderSession>;
  executeMessage(session: ProviderSession, message: string): Promise<AgentExecutionResult>;
  getProviderName(): string;
  getProviderInfo(): { framework: string; model: string };
}
```

Isso permite:
- ✅ **Troca dinâmica** de provider sem quebrar código
- ✅ **Ferramentas reutilizáveis** entre todos os providers
- ✅ **Adicionar novos providers** facilmente (ex: Anthropic Claude, LangChain)
- ✅ **Comparação A/B** entre providers
- ✅ **Fallback automático** em caso de falha

#### Seleção de Provider

O provider pode ser selecionado de 3 formas:

1. **Via Interface (UI)**: Componente `ProviderSelector` no frontend
2. **Via Variável de Ambiente**: `PROVIDER_TYPE` no `.env`
3. **Via Request Body**: Campo `provider` no POST `/api/chat`

### Fluxo de Dados

```
Frontend (React) ──POST /api/chat──▶ Backend (Express)
    │ provider: 'google-adk'              │
                                     ProviderFactory
                                    ┌─────┴──────┐
                                    │ Seleciona  │
                                    │  Adapter   │
                                    └─────┬──────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
            OpenAI Adapter         Gemini Adapter       OpenRouter Adapter
            │ run() SDK            │ Manual Loop        │ Manual Loop
            └─────┬─────           └──────┬─────        └──────┬─────
                  │                       │                    │
                  ▼                       ▼                    ▼
            GPT-4o-mini            Gemini 2.0 Flash     100+ Models
                                                        (GPT, Claude, etc)
                  │                       │                    │
            ──────┴───────────────────────┴────────────────────┘
                                    │
                          ┌─────────┼─────────┐
                          ▼         ▼         ▼
                      Tools    Handoffs    Context
                      (CSV,    (4 agentes) (shared)
                       API)
```

### Estrutura do Projeto

```
Desafio/
├── backend/
│   ├── src/
│   │   ├── agents/               # Definicao dos 4 agentes e handoffs
│   │   ├── tools/                # Ferramentas dos agentes (CSV, API, calculos)
│   │   ├── providers/            # Sistema multi-provider
│   │   │   ├── types.ts          # Interfaces e tipos base
│   │   │   ├── ProviderFactory.ts # Factory de providers
│   │   │   ├── tools/            # ToolConverter e registry
│   │   │   ├── openai-agents/    # Adapter OpenAI Agents
│   │   │   ├── google-gemini/    # Adapter Google Gemini
│   │   │   └── openrouter/       # Adapter OpenRouter
│   │   ├── services/             # Servicos de dados (CSV, cambio, score)
│   │   ├── routes/               # Endpoints (POST /api/chat, GET /api/providers)
│   │   ├── sessions/             # Gerenciamento de sessoes com providers
│   │   └── middleware/           # Tratamento de erros
│   └── data/                     # Arquivos CSV (clientes, scores, solicitacoes)
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Chat/             # ChatContainer, MessageList
│       │   ├── Sidebar/          # Sidebar com modos de agente
│       │   ├── Layout/           # Header, LogPanel
│       │   ├── ProviderSelector/ # Seletor de provider (novo!)
│       │   └── Documentation/    # Modal de documentacao
│       ├── hooks/                # useChat (com suporte a provider)
│       ├── api/                  # chatApi (com parametro provider)
│       ├── config/               # agentModes
│       └── styles/               # CSS (layout 3 paineis + visual bancario)
│
└── README.md
```

## Funcionalidades Implementadas

### Agentes e Logica de Negocios
- [x] Agente de Triagem com autenticacao (CPF + data nascimento)
- [x] 3 tentativas de autenticacao com encerramento gracioso via tool
- [x] Agente de Credito com consulta e aumento de limite
- [x] Registro de solicitacoes em CSV com status 'pendente' → 'aprovado'/'rejeitado' (fluxo em 2 passos)
- [x] Verificacao de score vs tabela de limites (score_limite.csv)
- [x] Agente de Entrevista com coleta conversacional (1 pergunta por vez)
- [x] Calculo de score com formula ponderada (renda, emprego, dependentes, dividas)
- [x] Atualizacao automatica do score no CSV
- [x] Agente de Cambio com cotacoes em tempo real (AwesomeAPI)
- [x] Handoffs transparentes entre agentes (cliente nao percebe a troca)
- [x] Ferramenta de encerramento de conversa (`encerrar_atendimento`) em todos os agentes
- [x] Bloqueio de mensagens apos encerramento da sessao
- [x] Tratamento de erros em todas as camadas
- [x] Sessoes com TTL de 30 minutos

### Interface do Usuario
- [x] Layout de 3 paineis: Sidebar | Chat | Log Panel (toggleavel)
- [x] Sidebar com selecao de 5 modos de agente (Completo + 4 individuais)
- [x] Agentes individuais com contexto pre-autenticado (modo demo)
- [x] Instrucoes de uso dinamicas por agente
- [x] Painel de logs super detalhado (tokens, tool calls, handoffs, timing, contexto)
- [x] Interface de chat profissional com visual bancario (azul escuro + teal)
- [x] Responsivo (mobile + desktop)

## Desafios Enfrentados e Como Foram Resolvidos

### 1. Handoffs em Providers sem Suporte Nativo (Gemini e OpenRouter)

**Problema:** O OpenAI Agents SDK possui handoffs nativos entre agentes, mas Google Gemini e OpenRouter nao oferecem essa funcionalidade. Sem isso, o sistema multi-provider nao conseguiria orquestrar as transicoes entre agentes.

**Solucao:** Implementacao de um loop de orquestracao manual nos adapters de Gemini e OpenRouter. O LLM recebe instrucoes para gerar um JSON especial quando deseja transferir para outro agente. O adapter detecta esse sinal, troca o agente ativo, atualiza o contexto e reinicia o loop com o novo agente — replicando o comportamento nativo do SDK da OpenAI.

### 2. Agente "Mudo" Apos Handoff (SYSTEM_TRIGGER)

**Problema:** Apos um handoff, o novo agente ficava em silencio aguardando o usuario falar primeiro. Isso quebrava a fluidez da conversa — o cliente nao sabia que havia sido transferido e ficava sem resposta.

**Solucao:** Criacao de um mecanismo de `[SYSTEM_TRIGGER]` no backend. Apos cada handoff detectado, o sistema injeta automaticamente uma mensagem interna que instrui o novo agente a se apresentar proativamente, cumprimentando o cliente pelo nome e informando como pode ajuda-lo. As respostas de ambos os agentes sao concatenadas numa unica resposta ao frontend, garantindo transicao transparente.

### 3. AwesomeAPI Bloqueada em Deploy (HTTP 429)

**Problema:** A API primaria de cotacao de cambio (AwesomeAPI) retorna HTTP 429 (rate limit) quando acessada de IPs de datacenter fora do Brasil — como os servidores do Railway nos EUA. Em ambiente local funcionava perfeitamente, mas em producao falhava.

**Solucao:** Implementacao de um sistema de fallback automatico com 3 APIs em cadeia: AwesomeAPI (primaria, dados completos) → ExchangeRate-API (global, funciona de qualquer regiao) → CoinGecko (especifica para Bitcoin). Cada API tem timeout de 10 segundos. Se uma falha, a proxima assume automaticamente sem intervencao do usuario.

### 4. Concorrencia em Escritas CSV

**Problema:** Requisicoes simultaneas ao backend podiam tentar ler e escrever nos mesmos arquivos CSV ao mesmo tempo, causando corrupcao de dados (linhas sobrepostas, dados parciais).

**Solucao:** Uso da biblioteca `proper-lockfile` para implementar file locking antes de qualquer operacao de escrita. O sistema adquire um lock exclusivo no arquivo, realiza a operacao read-modify-write, e so entao libera o lock. Configurado com 3 retries automaticos em caso de contencao, garantindo integridade dos dados mesmo sob carga.

### 5. Entrevista de Credito: Forcar 1 Pergunta por Vez

**Problema:** O LLM tendia a fazer todas as 5 perguntas da entrevista financeira de uma so vez, ignorando a instrucao de coleta conversacional. Isso prejudicava a experiencia do usuario e a qualidade das respostas.

**Solucao:** Instrucoes explicitas e enfaticas no system prompt do Agente de Entrevista: "Faca UMA pergunta por vez e aguarde a resposta antes de prosseguir para a proxima". A tool `realizar_entrevista` so e chamada quando os 5 dados estiverem coletados individualmente. Essa abordagem de prompt engineering foi mais eficaz do que tentar controlar o fluxo programaticamente.

### 6. Conversao de Tools entre Providers

**Problema:** Cada provider de IA tem um formato diferente para definicao de ferramentas. OpenAI usa JSON Schema, Gemini usa `FunctionDeclaration` com formato proprio, e OpenRouter usa o formato OpenAI via proxy. Manter definicoes duplicadas para cada provider seria fragil e propenso a erros.

**Solucao:** Criacao de um `ToolConverter` centralizado que recebe a definicao canonica das tools (formato OpenAI) e traduz automaticamente para o formato esperado por cada provider. Assim, cada ferramenta e definida uma unica vez e funciona em todos os 3 providers sem duplicacao de codigo.

## Escolhas Tecnicas e Justificativas

### Arquitetura Multi-Provider (Adapter Pattern)
Implementado usando **Adapter Pattern** para suportar 3 providers de IA diferentes sem quebrar codigo existente. Todos implementam a interface `ProviderAdapter`, permitindo troca dinamica, comparacao A/B e fallback automatico.

#### Tabela Comparativa dos AI Providers

| Criterio | OpenAI Agents SDK | Google Gemini | OpenRouter |
|----------|-------------------|---------------|------------|
| **Framework** | `@openai/agents` v0.4.6 | `@google/generative-ai` | OpenAI SDK + OpenRouter API |
| **Modelo** | gpt-4o-mini | gemini-2.0-flash-exp | 100+ (GPT, Claude, Llama, Mistral, Qwen) |
| **Handoffs** | Nativos (SDK gerencia automaticamente) | Orquestrados manualmente via loop | Orquestrados manualmente via loop |
| **Custo** | ~$0.15/1M tokens | **GRATUITO** (ate rate limits) | Varia por modelo ($-$$$) |
| **Velocidade** | Rapida (~2-3s) | Muito rapida (~1-2s) | Varia por modelo |
| **Tool Calling** | Nativo | Suportado | Nativo (formato OpenAI) |
| **Contexto** | Compartilhado por referencia | Mantido manualmente no adapter | Mantido manualmente no adapter |
| **Melhor para** | Producao enterprise, estabilidade | Desenvolvimento, testes, custo zero | Experimentacao, comparacao de modelos |

#### Por que cada provider foi escolhido?

- **OpenAI Agents SDK** — Escolhido como **baseline** por ter **handoffs nativos** entre agentes, exatamente o que o desafio exige. O SDK gerencia automaticamente a troca de agentes como tool calls do LLM, mantendo o contexto compartilhado por referencia.
- **Google Gemini** — Alternativa **completamente gratuita**. Usa orquestracao manual, mas com API sem custo e rate limits generosos. Ideal para desenvolvimento e testes.
- **OpenRouter** — Acesso a **100+ modelos** de diferentes providers (Anthropic Claude, Meta Llama, Mistral, etc.). Permite comparar qualidade e custo entre diferentes LLMs no mesmo sistema.

### APIs de Cotacao (com Fallback Automatico)
O sistema utiliza **3 APIs de cotacao com fallback automatico** para garantir disponibilidade em producao:

| Prioridade | API | Justificativa |
|------------|-----|---------------|
| 1 (primaria) | **AwesomeAPI** | API brasileira gratuita, sem autenticacao. Retorna dados completos (compra, venda, variacao, maxima, minima) |
| 2 (fallback) | **ExchangeRate-API** | API global gratuita, funciona de qualquer datacenter/regiao. Ativada quando AwesomeAPI retorna HTTP 429 (rate limit em IPs de datacenter fora do Brasil, ex: Railway nos EUA) |
| 3 (fallback BTC) | **CoinGecko** | API de criptomoedas. Ativada quando as anteriores falham para consultas de Bitcoin |

### CSV com File Locking
O desafio especifica CSV como formato de dados. Usamos `proper-lockfile` para evitar corrupcao em escritas concorrentes, garantindo integridade dos dados.

### React + Vite (sem Streamlit)
O desafio sugere Streamlit, mas como a stack escolhida e Node.js + React, optamos por uma SPA React pura com Vite para manter consistencia tecnologica e melhor experiencia do usuario. A interface implementada vai alem: possui sidebar com selecao de agentes, painel de logs detalhados e layout de 3 paineis.

## Tutorial de Execucao

### Pre-requisitos

- Node.js 18+
- Chave de API de **pelo menos um** provider:
  - **Google Gemini** (GRATUITO): https://aistudio.google.com/app/apikey
  - **OpenAI**: https://platform.openai.com/api-keys (pago)
  - **OpenRouter**: https://openrouter.ai/keys (pago, 100+ modelos)

### Configuracao

1. Clone o repositorio:
```bash
git clone <url-do-repositorio>
cd Desafio
```

2. Configure o backend:
```bash
cd backend
npm install
cp .env.example .env
# Edite .env e adicione as chaves de API dos providers
```

**Variáveis de Ambiente (`.env`)**:

```bash
# OpenAI Configuration (obrigatório se usar OpenAI Agents)
OPENAI_API_KEY=sk-proj-...

# Google Gemini Configuration (GRATUITO!)
GOOGLE_API_KEY=AIza...

# OpenRouter Configuration (opcional)
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini

# Provider Selection
PROVIDER_TYPE=google-adk          # openai-agents | google-adk | openrouter
ALLOW_PROVIDER_SELECTION=true    # Permite seleção via UI

# Server Config
PORT=3001
FRONTEND_URL=https://agilbank-production.up.railway.app
NODE_ENV=development
```

**Como obter as API Keys:**

- **OpenAI**: https://platform.openai.com/api-keys (pago, ~$0.15/1M tokens)
- **Google Gemini**: https://aistudio.google.com/app/apikey (**GRATUITO** até rate limits)
- **OpenRouter**: https://openrouter.ai/keys (pago, múltiplos modelos)

**Nota:** Você pode usar **apenas Google Gemini** (gratuito) para testar o sistema sem custo!

3. Configure o frontend:
```bash
cd ../frontend
npm install
```

### Execucao Local

1. Inicie o backend (porta 3001):
```bash
cd backend
npm run dev
```

2. Em outro terminal, inicie o frontend (porta 5173):
```bash
cd frontend
npm run dev
```

3. Acesse `https://agilbank-production.up.railway.app` no navegador.

### Dados para Teste

| CPF | Nome | Data Nascimento | Score | Limite |
|-----|------|----------------|-------|--------|
| 12345678901 | Joao Silva | 15/03/1985 | 720 | R$ 5.000 |
| 98765432100 | Maria Oliveira | 22/07/1990 | 450 | R$ 2.000 |
| 11122233344 | Carlos Santos | 10/12/1978 | 850 | R$ 15.000 |
| 55566677788 | Ana Costa | 05/01/1995 | 300 | R$ 1.000 |
| 99988877766 | Pedro Almeida | 18/09/1982 | 600 | R$ 3.500 |

## Cenarios de Teste Completos

Esta secao descreve **passo a passo** como testar cada requisito do desafio tecnico. Teste no modo **"Atendimento Completo"** para validar o fluxo orquestrado com todos os agentes.

---

### Tabela de Limites por Score

Conforme `backend/data/score_limite.csv`:

| Score Minimo | Score Maximo | Limite Maximo Permitido |
|--------------|--------------|------------------------|
| 0 | 299 | R$ 1.000 |
| 300 | 499 | R$ 3.000 |
| 500 | 699 | R$ 5.000 |
| 700 | 799 | R$ 10.000 |
| 800 | 899 | R$ 20.000 |
| 900 | 1000 | R$ 50.000 |

---

### 1️⃣ Teste: Agente de Triagem - Autenticacao Bem-Sucedida

**Requisito do Desafio:** Agente de Triagem autentica cliente via CPF + data de nascimento contra `clientes.csv` e direciona para o agente apropriado.

**Passos:**
1. Abra a interface em `https://agilbank-production.up.railway.app`
2. Selecione **"Atendimento Completo"** na sidebar
3. Digite: `Olá, preciso de ajuda`
4. O agente pedira seu **CPF**. Digite: `12345678901`
5. O agente pedira sua **data de nascimento**. Digite: `15/03/1985`
6. ✅ **Resultado Esperado:** Mensagem de boas-vindas chamando voce de "Joao Silva" e perguntando como pode ajudar

**Verificacao no Painel de Logs:**
- Abra o painel de logs (botao "Ver Logs" no header)
- Procure por `[TOOL] validar_cliente` com input contendo o CPF e data
- Verifique o `[RESULT]` retornando sucesso com o nome do cliente
- Confira o snapshot do contexto mostrando `authenticated: true`, `customerName: "Joao Silva"`, `currentScore: 720`

---

### 2️⃣ Teste: Agente de Triagem - Falha de Autenticacao (3 Tentativas)

**Requisito do Desafio:** Permitir ate 2 novas tentativas (total de 3). Apos a terceira falha, encerrar o atendimento de forma cordial.

**Passos:**
1. Inicie um **Novo Chat** (botao na sidebar)
2. Digite: `Oi`
3. Quando pedir o CPF, digite: `99999999999` (CPF invalido)
4. Quando pedir a data, digite: `01/01/2000` (data invalida)
5. ✅ **Resultado Esperado:** Mensagem informando que os dados nao conferem e pedindo para tentar novamente
6. Digite o CPF novamente: `88888888888` (invalido)
7. Digite a data novamente: `02/02/2002` (invalida)
8. ✅ **Resultado Esperado:** Segunda falha, ainda permite tentar
9. Digite o CPF pela terceira vez: `77777777777` (invalido)
10. Digite a data pela terceira vez: `03/03/2003` (invalida)
11. ✅ **Resultado Esperado:** Mensagem informando que nao foi possivel autenticar e encerrando o atendimento
12. Tente enviar outra mensagem (ex: "Oi")
13. ✅ **Resultado Esperado:** "Este atendimento foi encerrado. Por favor, inicie um novo chat para continuar."

**Verificacao no Painel de Logs:**
- Verifique 3 chamadas de `[TOOL] validar_cliente` com resultados de falha
- Na terceira falha, procure por `[TOOL] encerrar_atendimento`
- Confira o snapshot do contexto mostrando `conversationEnded: true`

---

### 3️⃣ Teste: Agente de Credito - Consulta de Limite

**Requisito do Desafio:** Informar limite de credito disponivel apos autenticacao.

**Passos:**
1. Autentique-se com **CPF:** `12345678901` e **Data:** `15/03/1985`
2. Apos autenticado, digite: `Gostaria de consultar meu limite de credito`
3. ✅ **Resultado Esperado:** Agente informa limite atual (R$ 5.000,00) e score (720 pontos)

**Verificacao no Painel de Logs:**
- Procure por `[HANDOFF]` de "Agente de Triagem" → "Agente de Credito"
- Procure por `[TOOL] consultar_credito`
- Verifique o `[RESULT]` retornando o limite e score

---

### 4️⃣ Teste: Agente de Credito - Aumento de Limite APROVADO

**Requisito do Desafio:** Cliente solicita aumento. Sistema registra em CSV com status 'pendente', verifica score, atualiza para 'aprovado' se score permitir.

**Passos:**
1. Autentique-se com **CPF:** `12345678901` e **Data:** `15/03/1985` (Joao Silva, score 720)
2. Digite: `Quero aumentar meu limite`
3. Quando o agente perguntar o valor, digite: `10000` (R$ 10.000)
4. ✅ **Resultado Esperado:** Solicitacao APROVADA! Score 720 permite limite maximo de R$ 10.000 (faixa 700-799)
5. Confirme que o novo limite e R$ 10.000,00

**Verificacao no Arquivo CSV:**
- Abra `backend/data/solicitacoes_aumento_limite.csv`
- Verifique uma nova linha com:
  - `cpf_cliente: 12345678901`
  - `status_pedido: aprovado`
  - `novo_limite_solicitado: 10000`

**Verificacao no Painel de Logs:**
- Procure por `[TOOL] solicitar_aumento_limite` com input `{"novoLimite": 10000}`
- Verifique o `[RESULT]` contendo "APROVADA"
- Confira o snapshot do contexto mostrando `currentLimit: 10000`

---

### 5️⃣ Teste: Agente de Credito - Aumento de Limite REJEITADO + Oferta de Entrevista

**Requisito do Desafio:** Se rejeitado, oferecer Entrevista de Credito para melhorar score.

**Passos:**
1. Inicie um **Novo Chat**
2. Autentique-se com **CPF:** `98765432100` e **Data:** `22/07/1990` (Maria Oliveira, score 450, limite R$ 2.000)
3. Digite: `Preciso de um limite maior`
4. Quando perguntar o valor, digite: `10000` (R$ 10.000)
5. ✅ **Resultado Esperado:** Solicitacao REJEITADA. Score 450 permite maximo de R$ 3.000 (faixa 300-499)
6. ✅ **Resultado Esperado:** Agente oferece entrevista de credito para reavaliar o score
7. Digite: `Sim, aceito fazer a entrevista`
8. ✅ **Resultado Esperado:** Handoff para Agente de Entrevista de Credito (veja teste 6)

**Verificacao no Arquivo CSV:**
- Abra `backend/data/solicitacoes_aumento_limite.csv`
- Verifique linha com:
  - `cpf_cliente: 98765432100`
  - `status_pedido: rejeitado`

**Verificacao no Painel de Logs:**
- Procure por `[TOOL] solicitar_aumento_limite` com resultado "REJEITADA"
- Procure por `[HANDOFF]` de "Agente de Credito" → "Agente de Entrevista de Credito"

---

### 6️⃣ Teste: Agente de Entrevista de Credito - Recalculo de Score

**Requisito do Desafio:** Conduz entrevista (UMA pergunta por vez), calcula novo score com formula ponderada, atualiza em `clientes.csv`, redireciona para Credito.

**Formula do Score:**
```
score = (renda / (despesas + 1)) * 30 +
        peso_emprego[tipo] +
        peso_dependentes[num] +
        peso_dividas[tem_dividas]

Pesos:
- formal: 300, autonomo: 200, desempregado: 0
- dependentes 0: 100, 1: 80, 2: 60, 3+: 30
- dividas sim: -100, nao: 100
```

**Passos (continuando do teste 5):**
1. Estando no Agente de Entrevista, aguarde a primeira pergunta: **"Qual e a sua renda mensal aproximada?"**
2. Digite: `8000` (R$ 8.000)
3. Aguarde a segunda pergunta: **"Qual o seu tipo de emprego atual?"**
4. Digite: `formal` (CLT)
5. Aguarde a terceira pergunta: **"Qual o valor aproximado das suas despesas fixas mensais?"**
6. Digite: `2000` (R$ 2.000)
7. Aguarde a quarta pergunta: **"Quantos dependentes voce possui?"**
8. Digite: `1` (1 dependente)
9. Aguarde a quinta pergunta: **"Voce possui alguma divida ativa no momento?"**
10. Digite: `nao`
11. ✅ **Resultado Esperado:** Agente informa que entrevista foi concluida e apresenta score anterior (450) vs novo score (calculado)
12. ✅ **Calculo Esperado:** `(8000 / (2000 + 1)) * 30 + 300 + 80 + 100 = 120 + 300 + 80 + 100 = 600`
13. ✅ **Resultado Esperado:** Handoff automatico para Agente de Credito para nova analise
14. Digite novamente: `Quero tentar aumentar meu limite para 5000`
15. ✅ **Resultado Esperado:** APROVADO! Score 600 permite maximo de R$ 5.000 (faixa 500-699)

**Verificacao no Arquivo CSV:**
- Abra `backend/data/clientes.csv`
- Verifique que o `score_credito` de Maria (CPF 98765432100) foi atualizado para 600

**Verificacao no Painel de Logs:**
- Procure por `[TOOL] realizar_entrevista` com input contendo todos os 5 dados
- Verifique o `[RESULT]` mostrando score anterior e novo score
- Procure por `[HANDOFF]` de "Agente de Entrevista de Credito" → "Agente de Credito"

---

### 7️⃣ Teste: Agente de Cambio - Cotacao de Moedas

**Requisito do Desafio:** Consultar cotacao de moedas em tempo real via API externa (AwesomeAPI).

**Passos:**
1. Autentique-se com qualquer cliente valido (ex: Joao Silva)
2. Digite: `Qual a cotacao do dolar hoje?`
3. ✅ **Resultado Esperado:** Handoff para Agente de Cambio
4. ✅ **Resultado Esperado:** Cotacao do USD em tempo real mostrando:
   - Valor de compra (bid) em R$
   - Valor de venda (ask) em R$
   - Variacao percentual do dia
5. Digite: `E do euro?`
6. ✅ **Resultado Esperado:** Cotacao do EUR em tempo real
7. Digite: `Obrigado, e so isso`
8. ✅ **Resultado Esperado:** Agente pergunta se precisa de algo mais ou se despede

**Moedas Suportadas:**
- USD (Dolar Americano)
- EUR (Euro)
- GBP (Libra Esterlina)
- ARS (Peso Argentino)
- CAD (Dolar Canadense)
- AUD (Dolar Australiano)
- JPY (Iene Japones)
- CNY (Yuan Chines)
- BTC (Bitcoin)

**Verificacao no Painel de Logs:**
- Procure por `[HANDOFF]` de "Agente de Triagem" → "Agente de Cambio"
- Procure por `[TOOL] consultar_cambio` com input `{"moeda": "USD"}`
- Verifique o `[RESULT]` contendo valores de compra, venda e variacao

---

### 8️⃣ Teste: Encerramento de Conversa com Ferramenta

**Requisito do Desafio:** Quando usuario solicitar fim da conversa, agente deve chamar ferramenta de encerramento para finalizar o loop de execucao.

**Passos:**
1. Em qualquer momento da conversa, digite: `Quero encerrar o atendimento`
2. ✅ **Resultado Esperado:** Agente chama a tool `encerrar_atendimento` e exibe mensagem de despedida
3. ✅ **Resultado Esperado:** Mensagem final contendo `[ATENDIMENTO ENCERRADO]`
4. Tente enviar nova mensagem (ex: "Oi")
5. ✅ **Resultado Esperado:** "Este atendimento foi encerrado. Por favor, inicie um novo chat para continuar."

**Verificacao no Painel de Logs:**
- Procure por `[TOOL] encerrar_atendimento`
- Verifique o snapshot do contexto mostrando `conversationEnded: true`

---

### 9️⃣ Teste: Handoffs Transparentes (Transicoes Implicitas)

**Requisito do Desafio:** Redirecionamentos entre agentes devem ser implicitos - cliente nao deve perceber a transicao.

**Passos:**
1. Autentique-se com Joao Silva
2. Digite: `Quero consultar meu limite e depois ver a cotacao do dolar`
3. ✅ **Resultado Esperado:**
   - Agente de Credito informa o limite
   - Automaticamente processa a segunda parte da solicitacao
   - Handoff para Agente de Cambio
   - Retorna cotacao do dolar
   - **Cliente NAO ve mensagens como "Transferindo para outro agente..."**

**Verificacao no Painel de Logs:**
- Procure por multiplos `[HANDOFF]` na mesma conversa
- Verifique que as mensagens ao usuario (`[MSG]`) NAO mencionam as transicoes

---

### 🔟 Teste: Modo de Agentes Individuais (Contexto Pre-Autenticado)

**Funcionalidade Extra da Interface:** Testar agentes individuais sem precisar autenticar.

**Passos:**
1. Na sidebar, clique em **"Agente de Credito"**
2. Leia as instrucoes exibidas na welcome screen
3. Digite: `Qual meu limite?`
4. ✅ **Resultado Esperado:** Resposta imediata como "Joao Silva (Demo)" com limite e score
5. **NAO houve autenticacao** - voce ja estava pre-autenticado em modo demo

**Teste os outros agentes individuais:**
- **Entrevista de Credito:** Responde as 5 perguntas para ver o recalculo
- **Agente de Cambio:** Peca cotacoes diretamente sem autenticar

**Verificacao no Painel de Logs:**
- No primeiro request, verifique o snapshot mostrando contexto pre-populado:
  ```
  authenticated: true
  cpf: "12345678901"
  customerName: "Joao Silva (Demo)"
  currentScore: 720
  currentLimit: 5000
  ```

---

### 1️⃣1️⃣ Teste: Painel de Logs Detalhados

**Funcionalidade Extra da Interface:** Painel com contagem de tokens, tool calls, handoffs, timing.

**Passos:**
1. Realize qualquer interacao (ex: autenticacao + consulta de limite)
2. Clique em **"Ver Logs"** no header
3. ✅ **Resultado Esperado:** Painel preto a direita com fonte monospace
4. Verifique que o painel mostra:
   - **Tokens:** Input, Output, Total, Requests
   - **Duracao:** Tempo em milissegundos
   - **Agente ativo:** Nome do ultimo agente
   - **Contexto:** Snapshot com CPF, nome, score, limite, status de autenticacao
   - **Items detalhados:**
     - `[MSG]` mensagens do agente
     - `[TOOL]` chamadas de ferramentas com input JSON formatado
     - `[RESULT]` resultados das ferramentas
     - `[HANDOFF]` transicoes entre agentes (source → target)

---

### 1️⃣2️⃣ Teste: Tratamento de Erros

**Requisito do Desafio:** Tratar erros de forma controlada (CSV indisponivel, API offline, entrada invalida).

**Teste A: Fallback de API de Cambio**
1. Autentique e peca cotacao do dolar
2. ✅ **Resultado Esperado:** Cotacao retornada com sucesso
3. **Verificacao nos Logs:** Se a AwesomeAPI falhar (ex: HTTP 429 em producao), os logs mostrarao:
   - `[ExchangeApi] AwesomeAPI retornou status 429 para USD`
   - `[ExchangeApi] AwesomeAPI falhou para USD, tentando fallback...`
   - `[ExchangeApi] ExchangeRate-API: cotacao obtida com sucesso para USD`
4. **Simular falha total:** Desconecte a internet para testar quando todas as APIs falham
5. ✅ **Resultado Esperado:** Mensagem amigavel informando que o servico esta temporariamente indisponivel

**Teste B: Entrada Invalida na Entrevista**
1. Durante a entrevista, quando perguntar renda mensal, digite: `texto` (nao e numero)
2. ✅ **Resultado Esperado:** Agente pede educadamente para informar um valor valido

**Teste C: Fora do Escopo**
1. Autentique e digite: `Quero fazer um PIX`
2. ✅ **Resultado Esperado:** Agente informa que no momento pode ajudar apenas com credito e cambio

---

## Resumo de Conformidade

Os testes acima validam os 11 requisitos do desafio tecnico:

| # | Requisito | Status | Detalhes |
|---|-----------|--------|----------|
| 1 | Agente de Triagem | ✅ Implementado | Autenticacao via CPF + data nascimento, 3 tentativas, direcionamento automatico |
| 2 | Agente de Credito | ✅ Implementado | Consulta de limite, aumento com verificacao de score, registro em CSV (pendente → aprovado/rejeitado) |
| 3 | Agente de Entrevista | ✅ Implementado | 5 perguntas (1 por vez), formula ponderada de score (0-1000), atualizacao automatica em CSV |
| 4 | Agente de Cambio | ✅ Implementado | Cotacoes em tempo real (9 moedas + BTC), fallback entre 3 APIs |
| 5 | Ferramenta de encerramento | ✅ Implementado | Tool `encerrar_atendimento` em todos os 4 agentes, bloqueia novas mensagens |
| 6 | Handoffs transparentes | ✅ Implementado | Transicoes implicitas - cliente nao percebe a troca entre agentes |
| 7 | Tratamento de erros | ✅ Implementado | Fallback de APIs, validacao de entrada, mensagens amigaveis para erros |
| 8 | Interface do Usuario (UI) | ✅ Implementado | UI conversacional com React + Vite, input de texto, historico de mensagens, sidebar de agentes e painel de logs |
| 9 | Dados em CSV | ✅ Implementado | 3 arquivos CSV com file locking (`proper-lockfile`) para escritas concorrentes |
| 10 | README.md com secoes obrigatorias | ✅ Implementado | Visao Geral, Arquitetura, Funcionalidades, Desafios, Escolhas tecnicas, Tutorial |
| 11 | Estrutura organizada do codigo | ✅ Implementado | Modulos separados por responsabilidade (agents/, tools/, data/) |

### Funcionalidades Extras (alem do desafio)

| Feature | Detalhes |
|---------|----------|
| Multi-provider de IA | 3 providers (OpenAI Agents, Google Gemini, OpenRouter) com selecao dinamica |
| Painel de logs avancado | Tokens, tool calls, handoffs, timing e snapshot de contexto |
