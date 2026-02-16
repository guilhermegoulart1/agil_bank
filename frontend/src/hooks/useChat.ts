// Hook customizado para gerenciar o estado e a logica do chat
// Suporta selecao de agente e acumula logs detalhados de cada requisicao

import { useState, useCallback, useRef } from 'react';
import type { Message, ChatState, LogData } from '../types/index.js';
import { enviarMensagem } from '../api/chatApi.js';

// Gera um ID unico simples para mensagens
function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useChat(agentId?: string, provider?: string, model?: string) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    sessionId: null,
    isLoading: false,
    logs: [],
  });
  const sessionIdRef = useRef<string | null>(null);

  // Envia uma mensagem do usuario e processa a resposta do agente
  const enviar = useCallback(async (conteudo: string) => {
    if (!conteudo.trim() || state.isLoading) return;

    // Adiciona a mensagem do usuario na interface
    const mensagemUsuario: Message = {
      id: gerarId(),
      role: 'user',
      content: conteudo,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, mensagemUsuario],
      isLoading: true,
    }));

    try {
      const resposta = await enviarMensagem(conteudo, sessionIdRef.current, agentId, provider, model);
      sessionIdRef.current = resposta.sessionId;

      // Converte as respostas do agente em mensagens da interface
      const mensagensAgente: Message[] = resposta.messages.map((msg) => ({
        id: gerarId(),
        role: 'assistant' as const,
        content: msg,
        timestamp: new Date(),
      }));

      // Adiciona timestamp ao log recebido
      const logComTimestamp: LogData = {
        ...resposta.logs,
        timestamp: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        sessionId: resposta.sessionId,
        messages: [...prev.messages, ...mensagensAgente],
        logs: [...prev.logs, logComTimestamp],
        isLoading: false,
      }));
    } catch (erro) {
      console.error('[useChat] Erro:', erro);

      // Mensagem de erro amigavel
      const mensagemErro: Message = {
        id: gerarId(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro de conexao. Por favor, tente novamente.',
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, mensagemErro],
        isLoading: false,
      }));
    }
  }, [state.isLoading, agentId, provider, model]);

  // Reinicia o chat (nova sessao, limpa logs)
  const reiniciar = useCallback(() => {
    sessionIdRef.current = null;
    setState({
      messages: [],
      sessionId: null,
      isLoading: false,
      logs: [],
    });
  }, []);

  return { ...state, enviar, reiniciar };
}
