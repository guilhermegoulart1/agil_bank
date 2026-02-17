// Rota principal do chat - processa mensagens do usuario e retorna respostas dos agentes
// Agora com suporte multi-provider

import { Router } from 'express';
import { sessionManager } from '../sessions/sessionManager.js';
import type { BankingContext } from '../agents/context.js';
import type { ProviderType } from '../providers/types.js';
import { config } from '../config/env.js';
import { ProviderFactory } from '../providers/ProviderFactory.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// POST /api/chat - Envia mensagem e recebe resposta do agente
chatRouter.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, message, agentId, provider, model } = req.body as {
      sessionId?: string;
      message: string;
      agentId?: string;
      provider?: ProviderType;
      model?: string;
    };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensagem e obrigatoria.' });
      return;
    }

    // Validate provider selection
    if (provider && !config.allowProviderSelection) {
      res.status(403).json({ error: 'Seleção de provider não habilitada.' });
      return;
    }

    // Recupera ou cria uma nova sessao
    let session = sessionId ? sessionManager.getSession(sessionId) : undefined;

    if (!session) {
      // Determina qual agente iniciar e se precisa de contexto pre-autenticado
      const agenteId = agentId || 'full';
      // Agentes que iniciam sem pre-autenticacao (triagem precisa autenticar o cliente)
      const agentsSemPreAuth = ['full', 'triage'];
      const contexto = agentsSemPreAuth.includes(agenteId) ? undefined : CONTEXTO_DEMO;

      session = await sessionManager.createSession(agenteId, contexto, provider, model);
    }

    // Update last activity
    session.lastActivity = new Date();

    // Bloqueia mensagens se a conversa ja foi encerrada
    if (session.providerSession.context.conversationEnded) {
      res.json({
        sessionId: session.id,
        messages: ['Este atendimento foi encerrado. Por favor, inicie um novo chat para continuar.'],
        logs: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalRequests: 0,
          totalTokens: 0,
          durationMs: 0,
          currentAgent: 'sistema',
          contextSnapshot: {
            conversationEnded: true,
          },
          items: [],
          provider: session.provider.getProviderName(),
        },
      });
      return;
    }

    // Execute message with provider
    const result = await session.provider.executeMessage(
      session.providerSession,
      message
    );

    // Detect handoff: if last log item is a handoff, trigger new agent proactively
    const lastLog = result.logs[result.logs.length - 1];
    if (lastLog?.type === 'handoff') {
      const ctx = session.providerSession.context;
      const nome = ctx.customerName ?? 'cliente';
      const score = ctx.currentScore !== undefined ? ` Score atual: ${ctx.currentScore}.` : '';
      const limite = ctx.currentLimit !== undefined ? ` Limite atual: R$ ${ctx.currentLimit.toFixed(2)}.` : '';

      const trigger =
        `[SYSTEM_TRIGGER] Voce acabou de receber o atendimento de outro agente.` +
        ` Cumprimente proativamente ${nome} pelo nome, apresente-se e informe o que pode fazer por ele.` +
        `${score}${limite}`;

      const proactive = await session.provider.executeMessage(
        session.providerSession,
        trigger
      );

      res.json({
        sessionId: session.id,
        messages: [...result.messages, ...proactive.messages],
        logs: {
          totalInputTokens: result.usage.inputTokens + proactive.usage.inputTokens,
          totalOutputTokens: result.usage.outputTokens + proactive.usage.outputTokens,
          totalRequests: result.usage.requests + proactive.usage.requests,
          totalTokens: result.usage.totalTokens + proactive.usage.totalTokens,
          durationMs: result.durationMs + proactive.durationMs,
          currentAgent: proactive.lastAgent || result.lastAgent || session.providerSession.agentId,
          contextSnapshot: {
            authenticated: session.providerSession.context.authenticated,
            cpf: session.providerSession.context.cpf,
            customerName: session.providerSession.context.customerName,
            currentScore: session.providerSession.context.currentScore,
            currentLimit: session.providerSession.context.currentLimit,
          },
          items: [...result.logs, ...proactive.logs],
          provider: session.provider.getProviderName(),
          providerInfo: session.provider.getProviderInfo(),
        },
      });
      return;
    }

    // Return response (no handoff)
    res.json({
      sessionId: session.id,
      messages: result.messages,
      logs: {
        totalInputTokens: result.usage.inputTokens,
        totalOutputTokens: result.usage.outputTokens,
        totalRequests: result.usage.requests,
        totalTokens: result.usage.totalTokens,
        durationMs: result.durationMs,
        currentAgent: result.lastAgent || session.providerSession.agentId,
        contextSnapshot: {
          authenticated: session.providerSession.context.authenticated,
          cpf: session.providerSession.context.cpf,
          customerName: session.providerSession.context.customerName,
          currentScore: session.providerSession.context.currentScore,
          currentLimit: session.providerSession.context.currentLimit,
        },
        items: result.logs,
        provider: session.provider.getProviderName(),
        providerInfo: session.provider.getProviderInfo(),
      },
    });
  } catch (erro: any) {
    console.error('[Chat] Erro ao processar mensagem:', erro);
    next(erro);
  }
});

// GET /api/providers - List available providers
chatRouter.get('/providers', async (_req, res) => {
  const providers: ProviderType[] = [];

  // Check which providers have API keys configured
  if (config.provider.openaiApiKey) providers.push('openai-agents');
  if (config.provider.googleApiKey) providers.push('google-adk');
  if (config.provider.openrouterApiKey) providers.push('openrouter');

  res.json({
    current: config.provider.default,
    available: providers,
    selectionEnabled: config.allowProviderSelection,
    info: {
      'openai-agents': {
        framework: '@openai/agents',
        model: 'gpt-4o-mini',
        cost: '$$',
        handoffs: 'Native',
      },
      'google-adk': {
        framework: '@google/genkit',
        model: 'gemini-2.0-flash',
        cost: 'FREE',
        handoffs: 'Native',
      },
      'openrouter': {
        framework: 'OpenAI SDK',
        model: 'Multiple (100+ models)',
        cost: '$ - $$$',
        handoffs: 'Manual',
      },
    },
  });
});

// GET /api/csv/:filename - Serve arquivos CSV permitidos para homologacao
chatRouter.get('/csv/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Whitelist de arquivos permitidos (seguranca)
    const allowedFiles = ['clientes', 'score_limite', 'solicitacoes_aumento_limite'];

    if (!allowedFiles.includes(filename)) {
      res.status(404).json({ error: 'Arquivo nao encontrado' });
      return;
    }

    // Ler arquivo CSV diretamente
    const filePath = join(__dirname, '../../data', `${filename}.csv`);
    const content = await readFile(filePath, 'utf-8');

    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.send(content);
  } catch (error: any) {
    console.error('[CSV] Erro ao servir arquivo:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Arquivo nao encontrado' });
    } else {
      next(error);
    }
  }
});
