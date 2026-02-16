import { useState, useEffect } from 'react';
import './ProviderSelector.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ProviderInfo {
  current: string;
  available: string[];
  selectionEnabled: boolean;
  info: Record<
    string,
    {
      framework: string;
      model: string;
      cost: string;
      handoffs?: string;
    }
  >;
}

interface ProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  disabled?: boolean;
}

// Available OpenRouter models
const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', cost: '$', speed: '⚡⚡' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', cost: '$$', speed: '⚡' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', cost: '$$$', speed: '⚡' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', cost: '$', speed: '⚡⚡⚡' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', cost: '$', speed: '⚡⚡' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', cost: '$', speed: '⚡⚡⚡' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', cost: '$$', speed: '⚡⚡' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', cost: '$$', speed: '⚡' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', cost: '$', speed: '⚡⚡' },
];

export function ProviderSelector({
  selectedProvider,
  onProviderChange,
  selectedModel = 'openai/gpt-4o-mini',
  onModelChange,
  disabled = false,
}: ProviderSelectorProps) {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const response = await fetch(`${API_BASE}/providers`);
      const data = await response.json();
      setProviderInfo(data);

      // Set initial provider from server if not set
      if (data.current && !selectedProvider) {
        onProviderChange(data.current);
      }
    } catch (error) {
      console.error('Erro ao carregar providers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !providerInfo) {
    return <div className="provider-selector loading">Carregando providers...</div>;
  }

  if (!providerInfo.selectionEnabled) {
    const info = providerInfo.info[providerInfo.current];
    return (
      <div className="provider-info">
        <span className="provider-badge">{getProviderLabel(providerInfo.current)}</span>
        <span className="provider-model">{info?.model}</span>
      </div>
    );
  }

  // Get all providers from info
  const allProviders = Object.keys(providerInfo.info);
  const showModelSelector = selectedProvider === 'openrouter' && providerInfo.available.includes('openrouter');

  return (
    <div className="provider-selector">
      <label htmlFor="provider-select">🤖 AI Provider:</label>
      <select
        id="provider-select"
        value={selectedProvider}
        onChange={(e) => onProviderChange(e.target.value)}
        disabled={disabled}
        className="provider-dropdown"
      >
        {allProviders.map((provider) => {
          const info = providerInfo.info[provider];
          const isAvailable = providerInfo.available.includes(provider);
          const label = isAvailable
            ? `${getProviderLabel(provider)} - ${info?.model} (${info?.cost})`
            : `${getProviderLabel(provider)} - ⚠️ API key não configurada`;

          return (
            <option key={provider} value={provider} disabled={!isAvailable}>
              {label}
            </option>
          );
        })}
      </select>

      {showModelSelector && (
        <>
          <label htmlFor="model-select">🎯 Modelo:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => onModelChange?.(e.target.value)}
            disabled={disabled}
            className="provider-dropdown model-dropdown"
          >
            {OPENROUTER_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.cost}) {model.speed}
              </option>
            ))}
          </select>
        </>
      )}

      <span className="provider-hint">{getProviderDescription(selectedProvider)}</span>
    </div>
  );
}

function getProviderLabel(provider: string): string {
  const labels: Record<string, string> = {
    'openai-agents': 'OpenAI Agents',
    'google-adk': 'Google ADK (Gemini)',
    'openrouter': 'OpenRouter',
  };
  return labels[provider] || provider;
}

function getProviderDescription(provider: string): string {
  const descriptions: Record<string, string> = {
    'openai-agents': 'Framework oficial OpenAI com handoffs nativos',
    'google-adk': 'Google ADK com Gemini 2.0 Flash (gratuito e rápido!)',
    'openrouter': 'Acesso a 100+ modelos (GPT, Claude, Llama, Mistral, etc.)',
  };
  return descriptions[provider] || '';
}
