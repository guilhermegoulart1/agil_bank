import express from 'express';
import cors from 'cors';
import { setDefaultOpenAIKey } from '@openai/agents';
import { config } from './config/env.js';
import { chatRouter } from './routes/chatRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Configuracao de CORS para aceitar requisicoes do frontend
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

// Configura a chave da OpenAI para o SDK de agentes
setDefaultOpenAIKey(config.openaiApiKey);

// Health check para monitoramento
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas do chat
app.use('/api', chatRouter);

// Tratamento global de erros
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Banco Agil backend rodando na porta ${config.port}`);
});
