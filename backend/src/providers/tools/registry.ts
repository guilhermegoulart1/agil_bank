// Tool registry - centralized tools in universal format
import { ToolConverter } from './ToolConverter.js';
import { validarClienteTool } from '../../tools/validateCustomer.js';
import { consultarCreditoTool } from '../../tools/queryCredit.js';
import { solicitarAumentoLimiteTool } from '../../tools/requestCreditIncrease.js';
import { realizarEntrevistaTool } from '../../tools/conductInterview.js';
import { consultarCambioTool } from '../../tools/fetchExchangeRate.js';
import { encerrarAtendimentoTool } from '../../tools/endConversation.js';

// Centralize all tools in universal format
export const toolRegistry = {
  validateCustomer: ToolConverter.fromOpenAIAgentsTool(validarClienteTool),
  queryCredit: ToolConverter.fromOpenAIAgentsTool(consultarCreditoTool),
  requestCreditIncrease: ToolConverter.fromOpenAIAgentsTool(solicitarAumentoLimiteTool),
  conductInterview: ToolConverter.fromOpenAIAgentsTool(realizarEntrevistaTool),
  fetchExchangeRate: ToolConverter.fromOpenAIAgentsTool(consultarCambioTool),
  endConversation: ToolConverter.fromOpenAIAgentsTool(encerrarAtendimentoTool),
};

// Mapping of tools per agent (for providers without native handoffs)
export const toolsByAgent: Record<string, string[]> = {
  full: ['validateCustomer', 'endConversation'], // Full starts with triage
  triage: ['validateCustomer', 'endConversation'],
  credit: ['queryCredit', 'requestCreditIncrease', 'endConversation'],
  'credit-interview': ['conductInterview', 'endConversation'],
  exchange: ['fetchExchangeRate', 'endConversation'],
};
