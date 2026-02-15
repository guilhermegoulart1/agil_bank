// Cliente HTTP para comunicacao com o backend

import type { ChatApiResponse } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Envia uma mensagem para o backend e retorna a resposta do agente
// agentId define qual agente usar (null/undefined = triage padrao)
export async function enviarMensagem(
  message: string,
  sessionId: string | null,
  agentId?: string
): Promise<ChatApiResponse> {
  const resposta = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, agentId }),
  });

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
  }

  return resposta.json();
}
