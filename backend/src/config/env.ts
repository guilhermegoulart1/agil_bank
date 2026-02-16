import dotenv from 'dotenv';
import type { ProviderType } from '../providers/types.js';

dotenv.config();

// Configuracoes do ambiente carregadas de variaveis de ambiente
export const config = {
  // Existing configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Multi-provider configuration
  provider: {
    default: (process.env.PROVIDER_TYPE || 'openai-agents') as ProviderType,

    // API Keys for different providers
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',

    // OpenRouter specific configuration
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    openrouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  },

  // Allow users to select provider in UI
  allowProviderSelection: process.env.ALLOW_PROVIDER_SELECTION !== 'false',
};
