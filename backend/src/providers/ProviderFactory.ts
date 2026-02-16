// Provider factory - creates provider adapters based on configuration
import type { ProviderType, ProviderAdapter, ProviderConfig } from './types.js';
import { OpenAIAgentsAdapter } from './openai-agents/OpenAIAgentsAdapter.js';
import { OpenRouterAdapter } from './openrouter/OpenRouterAdapter.js';
import { GoogleGeminiAdapter } from './google-gemini/GoogleGeminiAdapter.js';

export class ProviderFactory {
  static createProvider(config: ProviderConfig): ProviderAdapter {
    switch (config.type) {
      case 'openai-agents':
        return new OpenAIAgentsAdapter(config.apiKey);

      case 'google-adk':
        return new GoogleGeminiAdapter(config.apiKey, config.model);

      case 'openrouter':
        return new OpenRouterAdapter(
          config.apiKey,
          config.baseUrl,
          config.model
        );

      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  static getSupportedProviders(): ProviderType[] {
    return ['openai-agents', 'google-adk', 'openrouter'];
  }
}
