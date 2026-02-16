# Banco Agil - Agente Bancario Inteligente

Sistema de atendimento ao cliente para o banco digital **Banco Agil**, construido com agentes de IA especializados que se comunicam de forma transparente ao usuario.

## Visao Geral

O Banco Agil e um sistema multi-agente onde 4 agentes de IA especializados colaboram para atender o cliente de forma inteligente e contextual. O sistema utiliza o **OpenAI Agents SDK** para orquestrar as transicoes (handoffs) entre agentes de forma transparente - para o cliente, a experiencia e de conversar com um unico assistente.

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

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js + TypeScript + Express |
| Agentes IA | OpenAI Agents SDK (`@openai/agents`) |
| Modelo LLM | GPT-4o-mini |
| Frontend | React + TypeScript + Vite |
| API de Cambio | AwesomeAPI (gratuita, sem chave) |
| Dados | CSV com file locking (`proper-lockfile`) |
| Deploy | Railway |

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
- Consulta cotacoes em tempo real via AwesomeAPI
- Suporta: USD, EUR, GBP, ARS, CAD, AUD, JPY, CNY, BTC
- Apresenta valores de compra, venda e variacao

### Fluxo de Dados

```
Frontend (React) ──POST /api/chat──▶ Backend (Express)
                                         │
                                    OpenAI Agents SDK
                                    ┌────┴────┐
                                    │  run()  │
                                    └────┬────┘
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                          Tools      Handoffs    LLM (GPT-4o-mini)
                          (CSV,       (entre
                          API)        agentes)
```

### Estrutura do Projeto

```
Desafio/
├── backend/
│   ├── src/
│   │   ├── agents/        # Definicao dos 4 agentes e handoffs
│   │   ├── tools/         # Ferramentas dos agentes (CSV, API, calculos)
│   │   ├── services/      # Servicos de dados (CSV, cambio, score)
│   │   ├── routes/        # Endpoint POST /api/chat
│   │   ├── sessions/      # Gerenciamento de sessoes em memoria
│   │   └── middleware/     # Tratamento de erros
│   └── data/              # Arquivos CSV (clientes, scores, solicitacoes)
│
├── frontend/
│   └── src/
│       ├── components/    # Componentes React (Sidebar, Chat, LogPanel)
│       ├── hooks/         # Hook useChat para logica do chat
│       ├── api/           # Cliente HTTP para o backend
│       ├── config/        # Configuracao dos modos de agente
│       └── styles/        # CSS (layout 3 paineis + visual bancario)
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

## Escolhas Tecnicas e Justificativas

### OpenAI Agents SDK
Escolhido por ter **handoffs nativos** entre agentes - exatamente o que o desafio exige. O SDK gerencia automaticamente a troca de agentes como tool calls do LLM, mantendo o contexto compartilhado por referencia.

### GPT-4o-mini
Modelo rapido e econômico, suficiente para o caso de uso de atendimento bancario. Responde em poucos segundos e segue bem as instrucoes dos system prompts.

### CSV com File Locking
O desafio especifica CSV como formato de dados. Usamos `proper-lockfile` para evitar corrupcao em escritas concorrentes, garantindo integridade dos dados.

### AwesomeAPI
API brasileira gratuita e sem autenticacao para cotacoes de cambio. Retorna dados em tempo real com suporte nativo a BRL.

### React + Vite (sem Streamlit)
O desafio sugere Streamlit, mas como a stack escolhida e Node.js + React, optamos por uma SPA React pura com Vite para manter consistencia tecnologica e melhor experiencia do usuario. A interface implementada vai alem: possui sidebar com selecao de agentes, painel de logs detalhados e layout de 3 paineis inspirado em Claude/ChatGPT.

## Desafios Enfrentados e Solucoes

### 1. Tipagem do OpenAI Agents SDK
O SDK usa Zod v4 (nao v3) e o `RunContext` e opcional nos parametros das tools. Resolvido ajustando as assinaturas para aceitar `context?: RunContext<T>`.

### 2. Persistencia do Historico entre Mensagens
O SDK espera o historico completo da conversa a cada chamada. Resolvido armazenando `result.history` na sessao e passando na proxima interacao.

### 3. Handoffs Circulares
Credito → Entrevista → Credito cria referencia circular. Resolvido definindo agentes primeiro com `handoffs: []` e conectando depois em um arquivo central (`agents/index.ts`).

### 4. Score Pode Exceder 1000
A formula pode gerar valores acima de 1000 para rendas muito altas. Resolvido com `Math.max(0, Math.min(1000, score))` no calculador.

### 5. Encerramento Programatico de Conversa
O desafio exige uma "ferramenta de encerramento para finalizar o loop de execucao". Criamos a tool `encerrar_atendimento` que seta uma flag no contexto (`conversationEnded: true`), bloqueando novas mensagens na sessao. Todos os 4 agentes possuem essa tool e foram instruidos a usa-la ao inves de apenas dizer "tchau".

## Tutorial de Execucao

### Pre-requisitos

- Node.js 18+
- Chave de API da OpenAI

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
# Edite .env e adicione sua OPENAI_API_KEY
```

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

3. Acesse `http://localhost:5173` no navegador.

### Dados para Teste

Use os CPFs e datas abaixo para testar o sistema:

| CPF | Nome | Data Nascimento | Score | Limite Atual |
|-------------|----------------|-----------------|-------|--------------|
| 12345678901 | Joao Silva | 15/03/1985 | 720 | R$ 5.000 |
| 98765432100 | Maria Oliveira | 22/07/1990 | 450 | R$ 2.000 |
| 11122233344 | Carlos Santos | 10/12/1978 | 850 | R$ 15.000 |
| 55566677788 | Ana Costa | 05/01/1995 | 300 | R$ 1.000 |
| 99988877766 | Pedro Almeida | 18/09/1982 | 600 | R$ 3.500 |

**Dica:** Use o CPF `12345678901` com data `15/03/1985` para testes gerais.

## Cenarios de Teste Completos

Esta secao descreve **passo a passo** como testar cada requisito do desafio tecnico. Teste no modo **"Atendimento Completo"** para validar o fluxo orquestrado com todos os agentes.

---

### Tabela de Limites por Score

Esta tabela define o limite máximo permitido baseado no score de crédito do cliente:

| Faixa de Score | Limite Máximo Permitido |
|----------------|-------------------------|
| 0 - 299 | R$ 1.000 |
| 300 - 499 | R$ 3.000 |
| 500 - 699 | R$ 5.000 |
| 700 - 799 | R$ 10.000 |
| 800 - 899 | R$ 20.000 |
| 900 - 1000 | R$ 50.000 |

**Exemplo:** Um cliente com score 720 pode ter até R$ 10.000 de limite.

---

### 1️⃣ Teste: Agente de Triagem - Autenticacao Bem-Sucedida

**Requisito do Desafio:** Agente de Triagem autentica cliente via CPF + data de nascimento contra `clientes.csv` e direciona para o agente apropriado.

**Passos:**
1. Abra a interface em `http://localhost:5173`
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

**Teste A: API de Cambio Indisponivel**
1. **Simular:** Desconecte a internet ou bloqueie `economia.awesomeapi.com.br`
2. Autentique e peca cotacao do dolar
3. ✅ **Resultado Esperado:** Mensagem amigavel informando que o servico esta temporariamente indisponivel

**Teste B: Entrada Invalida na Entrevista**
1. Durante a entrevista, quando perguntar renda mensal, digite: `texto` (nao e numero)
2. ✅ **Resultado Esperado:** Agente pede educadamente para informar um valor valido

**Teste C: Fora do Escopo**
1. Autentique e digite: `Quero fazer um PIX`
2. ✅ **Resultado Esperado:** Agente informa que no momento pode ajudar apenas com credito e cambio

---

## Resumo de Conformidade

Todos os 12 testes acima validam os requisitos do desafio tecnico:

✅ Agente de Triagem: autenticacao + direcionamento
✅ Agente de Credito: consulta + aumento de limite + registro CSV
✅ Agente de Entrevista: 5 perguntas + formula de score + atualizacao CSV
✅ Agente de Cambio: cotacoes em tempo real
✅ Ferramenta de encerramento em todos os agentes
✅ Handoffs transparentes (implicitos)
✅ Tratamento de erros robusto
✅ Interface completa com logs detalhados

### Deploy na Railway

1. Push para GitHub
2. No Railway, crie um novo projeto do repositorio
3. Crie 2 servicos (backend e frontend) apontando para o mesmo repo
4. Configure:
   - **Backend**: Root Directory = `backend`, env vars: `OPENAI_API_KEY`, `FRONTEND_URL`
   - **Frontend**: Root Directory = `frontend`, env var: `VITE_API_URL` (URL do backend + `/api`)
5. Deploy
