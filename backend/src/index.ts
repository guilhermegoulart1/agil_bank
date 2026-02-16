import express from 'express';
import cors from 'cors';
import { setDefaultOpenAIKey } from '@openai/agents';
import { config } from './config/env.js';
import { chatRouter } from './routes/chatRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// === STARTUP LOGS ===
console.log('[STARTUP] Iniciando servidor...');
console.log('[STARTUP] NODE_ENV:', config.nodeEnv);
console.log('[STARTUP] PORT:', config.port);
console.log('[STARTUP] FRONTEND_URL:', config.frontendUrl);
console.log('[STARTUP] OPENAI_API_KEY:', config.openaiApiKey ? 'SET (' + config.openaiApiKey.slice(0, 8) + '...)' : 'NOT SET');
console.log('[STARTUP] GOOGLE_API_KEY:', config.provider.googleApiKey ? 'SET' : 'NOT SET');
console.log('[STARTUP] OPENROUTER_API_KEY:', config.provider.openrouterApiKey ? 'SET' : 'NOT SET');
console.log('[STARTUP] PROVIDER_TYPE:', config.provider.default);

// Configuracao de CORS para aceitar requisicoes do frontend
const allowedOrigins = config.frontendUrl
  .split(',')
  .map((url: string) => url.trim())
  .filter(Boolean);

console.log('[CORS] Origens permitidas:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (health checks, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    console.log('[CORS] Bloqueado:', origin);
    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// Log de todas as requests
app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Configura a chave da OpenAI para o SDK de agentes (apenas se disponivel)
if (config.openaiApiKey) {
  try {
    setDefaultOpenAIKey(config.openaiApiKey);
    console.log('[STARTUP] OpenAI key configurada com sucesso');
  } catch (err) {
    console.error('[STARTUP] Erro ao configurar OpenAI key:', err);
  }
} else {
  console.log('[STARTUP] OpenAI key NAO configurada - provider openai-agents indisponivel');
}

// Health check para monitoramento
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas do chat
app.use('/api', chatRouter);

// Tratamento global de erros
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[STARTUP] Banco Agil backend rodando na porta ${config.port}`);
  console.log('[STARTUP] Servidor pronto para receber requests!');
});
