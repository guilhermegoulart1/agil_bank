import dotenv from 'dotenv';
dotenv.config();

// Configuracoes do ambiente carregadas de variaveis de ambiente
export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
