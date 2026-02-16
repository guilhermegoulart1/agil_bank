// Cliente HTTP para comunicacao com o backend

import type { ChatApiResponse } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

console.log('[CONFIG] VITE_API_URL:', import.meta.env.VITE_API_URL || 'NOT SET (usando /api)');
console.log('[CONFIG] API_BASE:', API_BASE);

// Token de autenticacao (gerenciado via setAuthToken)
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;
  return headers;
}

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
  const url = `${API_BASE}/chat`;
  console.log('[CHAT] Enviando para:', url);

  const resposta = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, sessionId, agentId, provider, model }),
  });

  console.log('[CHAT] Resposta:', resposta.status, resposta.statusText);

  if (resposta.status === 401) {
    sessionStorage.removeItem('bancoagil_token');
    window.location.reload();
    throw new Error('Sessao expirada. Redirecionando para login...');
  }

  if (!resposta.ok) {
    const errorText = await resposta.text().catch(() => '');
    console.error('[CHAT] Erro body:', errorText);
    throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
  }

  return resposta.json();
}
