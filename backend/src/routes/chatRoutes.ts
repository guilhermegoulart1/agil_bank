// Rota principal do chat - processa mensagens do usuario e retorna respostas dos agentes

import { Router } from 'express';
import { run, type AgentInputItem } from '@openai/agents';
import { sessionManager } from '../sessions/sessionManager.js';
import { triageAgent, agentMap } from '../agents/index.js';
import type { BankingContext } from '../agents/context.js';

export const chatRouter = Router();

// Contexto pre-autenticado para agentes individuais (modo demo)
const CONTEXTO_DEMO: Partial<BankingContext> = {
  authenticated: true,
  authAttempts: 0,
  cpf: '12345678901',
  customerName: 'Joao Silva (Demo)',
  currentScore: 720,
  currentLimit: 5000,
};

// Tipo para itens de log detalhados retornados ao frontend
interface LogItem {
  type: 'message' | 'tool_call' | 'tool_output' | 'handoff';
  agent?: string;
  content?: string;
  toolName?: string;
  input?: string;
  output?: string;
  sourceAgent?: string;
  targetAgent?: string;
}

interface LogData {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  totalTokens: number;
  durationMs: number;
  currentAgent: string;
  contextSnapshot: Partial<BankingContext>;
  items: LogItem[];
}

// POST /api/chat - Envia mensagem e recebe resposta do agente
chatRouter.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, message, agentId } = req.body as {
      sessionId?: string;
      message: string;
      agentId?: string;
    };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensagem e obrigatoria.' });
      return;
    }

    // Recupera ou cria uma nova sessao
    let session = sessionId
      ? sessionManager.getSession(sessionId)
      : undefined;

    if (!session) {
      // Determina qual agente iniciar e se precisa de contexto pre-autenticado
      const agenteId = agentId || 'full';
      const agente = agentMap[agenteId] || triageAgent;
      // Agentes que iniciam sem pre-autenticacao (triagem precisa autenticar o cliente)
      const agentsSemPreAuth = ['full', 'triage'];
      const contexto = agentsSemPreAuth.includes(agenteId) ? undefined : CONTEXTO_DEMO;
      session = sessionManager.createSession(agente, contexto);
    }

    // Bloqueia mensagens se a conversa ja foi encerrada
    if (session.context.conversationEnded) {
      res.json({
        sessionId: session.id,
        messages: ['Este atendimento foi encerrado. Por favor, inicie um novo chat para continuar.'],
        logs: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalRequests: 0,
          totalTokens: 0,
          durationMs: 0,
          currentAgent: session.currentAgent.name,
          contextSnapshot: {
            conversationEnded: true,
          },
          items: [],
        },
      });
      return;
    }

    // Adiciona a mensagem do usuario ao historico
    session.inputItems.push({
      role: 'user',
      content: message,
    } as AgentInputItem);

    // Mede o tempo de execucao do loop do agente
    const inicio = Date.now();

    // Executa o loop do agente
    const result = await run(session.currentAgent, session.inputItems, {
      context: session.context,
      maxTurns: 15,
    });

    const durationMs = Date.now() - inicio;

    // Extrai as mensagens de texto do agente e monta os itens de log detalhados
    const mensagensAgente: string[] = [];
    const logItems: LogItem[] = [];

    for (const item of result.newItems) {
      switch (item.type) {
        case 'message_output_item': {
          // Mensagem textual do agente
          const conteudo = (item as any).content as string;
          if (conteudo) {
            mensagensAgente.push(conteudo);
            logItems.push({
              type: 'message',
              agent: (item as any).agent?.name || 'desconhecido',
              content: conteudo,
            });
          }
          break;
        }
        case 'tool_call_item': {
          // Chamada de ferramenta (tool call)
          const rawItem = (item as any).rawItem;
          logItems.push({
            type: 'tool_call',
            agent: (item as any).agent?.name || 'desconhecido',
            toolName: rawItem?.name || 'desconhecido',
            input: rawItem?.arguments || '{}',
          });
          break;
        }
        case 'tool_call_output_item': {
          // Resultado de ferramenta
          const output = (item as any).output;
          logItems.push({
            type: 'tool_output',
            agent: (item as any).agent?.name || 'desconhecido',
            output: typeof output === 'string' ? output : JSON.stringify(output),
          });
          break;
        }
        case 'handoff_output_item': {
          // Transferencia entre agentes (handoff)
          logItems.push({
            type: 'handoff',
            sourceAgent: (item as any).sourceAgent?.name || 'desconhecido',
            targetAgent: (item as any).targetAgent?.name || 'desconhecido',
          });
          break;
        }
      }
    }

    // Extrai dados de uso de tokens do SDK
    const usage = result.state.usage;
    const logs: LogData = {
      totalInputTokens: usage?.inputTokens ?? 0,
      totalOutputTokens: usage?.outputTokens ?? 0,
      totalRequests: usage?.requests ?? 0,
      totalTokens: usage?.totalTokens ?? 0,
      durationMs,
      currentAgent: result.lastAgent?.name || 'desconhecido',
      contextSnapshot: {
        authenticated: session.context.authenticated,
        cpf: session.context.cpf,
        customerName: session.context.customerName,
        currentScore: session.context.currentScore,
        currentLimit: session.context.currentLimit,
      },
      items: logItems,
    };

    // Atualiza o historico da sessao com o historico completo do resultado
    session.inputItems = result.history;

    // Atualiza o agente ativo (pode ter mudado por handoff)
    if (result.lastAgent) {
      session.currentAgent = result.lastAgent as any;
    }

    res.json({
      sessionId: session.id,
      messages: mensagensAgente,
      logs,
    });
  } catch (erro: any) {
    console.error('[Chat] Erro ao processar mensagem:', erro);
    next(erro);
  }
});
