// Cliente HTTP para comunicacao com o backend

import type { ChatApiResponse } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Envia uma mensagem para o backend e retorna a resposta do agente
// agentId define qual agente usar (null/undefined = triage padrao)
// provider define qual provider usar (null/undefined = provider padrao do backend)
// model define qual modelo usar (para OpenRouter)
export async function enviarMensagem(
  message: string,
  sessionId: string | null,
  agentId?: string,
  provider?: string,
  model?: string
): Promise<ChatApiResponse> {
  const resposta = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, agentId, provider, model }),
  });

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
  }

  return resposta.json();
}
