// Painel de logs detalhados - fundo preto, monospace, super detalhado

import { useEffect, useRef } from 'react';
import type { LogData, LogItem } from '../../types/index.js';

interface LogPanelProps {
  logs: LogData[];
  isOpen: boolean;
  onClose: () => void;
}

// Precos por 1M tokens (USD) - baseado nos precos publicos de cada provider/modelo
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o-mini':              { input: 0.15,  output: 0.60 },
  'gpt-4o':                   { input: 2.50,  output: 10.00 },
  // Google
  'gemini-2.0-flash':         { input: 0.10,  output: 0.40 },
  // Anthropic
  'claude-3.5-sonnet':        { input: 3.00,  output: 15.00 },
  'claude-3-haiku':           { input: 0.25,  output: 1.25 },
  // Meta
  'llama-3.1-70b-instruct':   { input: 0.52,  output: 0.75 },
  'llama-3.1-8b-instruct':    { input: 0.06,  output: 0.06 },
  // Google via OpenRouter
  'gemini-pro-1.5':           { input: 1.25,  output: 5.00 },
  // Mistral
  'mistral-large':            { input: 2.00,  output: 6.00 },
  // Qwen
  'qwen-2.5-72b-instruct':   { input: 0.35,  output: 0.40 },
};

function getModelKey(model?: string): string {
  if (!model) return '';
  return model.includes('/') ? model.split('/').pop()! : model;
}

function calcularCusto(inputTokens: number, outputTokens: number, model?: string): number | null {
  const key = getModelKey(model);
  const pricing = TOKEN_PRICING[key];
  if (!pricing) return null;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

// Formata JSON de forma compacta para exibicao
function formatarJson(str: string): string {
  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
}

// Renderiza um item de log individual
function LogItemEntry({ item }: { item: LogItem }) {
  switch (item.type) {
    case 'message':
      return (
        <div className="log-item log-message">
          <div className="log-item-agent">{item.agent}</div>
          <div>
            <span className="log-item-tag">[MSG]</span>
            <span className="log-item-content">
              {item.content && item.content.length > 200
                ? item.content.substring(0, 200) + '...'
                : item.content}
            </span>
          </div>
        </div>
      );
    case 'tool_call':
      return (
        <div className="log-item log-tool-call">
          <div className="log-item-agent">{item.agent}</div>
          <div>
            <span className="log-item-tag">[TOOL]</span>
            <span className="log-item-content">{item.toolName}</span>
          </div>
          {item.input && (
            <div className="log-item-json">{formatarJson(item.input)}</div>
          )}
        </div>
      );
    case 'tool_output':
      return (
        <div className="log-item log-tool-output">
          <div className="log-item-agent">{item.agent}</div>
          <div>
            <span className="log-item-tag">[RESULT]</span>
            <span className="log-item-content">
              {item.output && item.output.length > 300
                ? item.output.substring(0, 300) + '...'
                : item.output}
            </span>
          </div>
        </div>
      );
    case 'handoff':
      return (
        <div className="log-item log-handoff">
          <div className="log-handoff-banner">
            <span className="log-handoff-icon">&hArr;</span>
            <span className="log-handoff-label">TROCA DE AGENTE</span>
          </div>
          <div className="log-handoff-detail">
            <span className="log-handoff-agent log-handoff-source">{item.sourceAgent}</span>
            <span className="log-handoff-arrow">&rarr;</span>
            <span className="log-handoff-agent log-handoff-target">{item.targetAgent}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function LogPanel({ logs, isOpen, onClose }: LogPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novos logs chegam
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className={`log-panel ${isOpen ? '' : 'collapsed'}`}>
      <div className="log-header">
        <span className="log-header-title">&gt;_ Logs Detalhados</span>
        <button className="btn-close-logs" onClick={onClose} title="Fechar logs">
          &times;
        </button>
      </div>

      <div className="log-content">
        {logs.length === 0 ? (
          <div className="log-empty">
            <div className="log-empty-icon">&gt;_</div>
            <div className="log-empty-text">
              Envie uma mensagem para ver<br />os logs detalhados aqui
            </div>
          </div>
        ) : (
          logs.map((logData, idx) => (
            <div key={idx} className="log-request-block">
              {/* Header do request */}
              <div className="log-request-header">
                <span className="log-request-time">
                  Request #{idx + 1} - {logData.timestamp
                    ? new Date(logData.timestamp).toLocaleTimeString('pt-BR')
                    : ''}
                </span>
                <span className="log-request-duration">
                  {logData.durationMs}ms
                </span>
              </div>

              {/* Tokens */}
              <div className="log-tokens">
                <div className="log-token-item">
                  <span className="log-token-label">Input:</span>
                  <span className="log-token-value">{logData.totalInputTokens.toLocaleString()}</span>
                </div>
                <div className="log-token-item">
                  <span className="log-token-label">Output:</span>
                  <span className="log-token-value">{logData.totalOutputTokens.toLocaleString()}</span>
                </div>
                <div className="log-token-item">
                  <span className="log-token-label">Total:</span>
                  <span className="log-token-value">{logData.totalTokens.toLocaleString()}</span>
                </div>
                <div className="log-token-item">
                  <span className="log-token-label">Requests:</span>
                  <span className="log-token-value">{logData.totalRequests}</span>
                </div>
              </div>

              {/* Custo estimado */}
              {(() => {
                const model = logData.providerInfo?.model;
                const custo = calcularCusto(logData.totalInputTokens, logData.totalOutputTokens, model);
                return (
                  <div className="log-cost">
                    <span className="log-cost-label">Custo:</span>
                    {custo !== null ? (
                      <span className="log-cost-value">${custo.toFixed(6)}</span>
                    ) : (
                      <span className="log-cost-na">N/A</span>
                    )}
                    {model && (
                      <span className="log-cost-label">({getModelKey(model)})</span>
                    )}
                  </div>
                );
              })()}

              {/* Agente ativo */}
              <div className="log-agent-info">
                Agente ativo: {logData.currentAgent}
              </div>

              {/* Contexto da sessao */}
              {logData.contextSnapshot && (
                <div className="log-context">
                  <div className="log-context-title">Contexto:</div>
                  {logData.contextSnapshot.customerName && (
                    <div>Cliente: {logData.contextSnapshot.customerName}</div>
                  )}
                  {logData.contextSnapshot.cpf && (
                    <div>CPF: {logData.contextSnapshot.cpf}</div>
                  )}
                  {logData.contextSnapshot.currentScore !== undefined && (
                    <div>Score: {logData.contextSnapshot.currentScore}</div>
                  )}
                  {logData.contextSnapshot.currentLimit !== undefined && (
                    <div>Limite: R$ {logData.contextSnapshot.currentLimit?.toLocaleString('pt-BR')}</div>
                  )}
                  <div>Auth: {logData.contextSnapshot.authenticated ? 'Sim' : 'Nao'}</div>
                </div>
              )}

              {/* Items detalhados */}
              <div className="log-items">
                {logData.items.map((item, itemIdx) => (
                  <LogItemEntry key={itemIdx} item={item} />
                ))}
                {logData.items.length === 0 && (
                  <div style={{ color: '#555', fontStyle: 'italic' }}>
                    Nenhum item neste request
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
