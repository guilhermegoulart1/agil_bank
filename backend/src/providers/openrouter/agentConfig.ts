// Agent configuration for OpenRouter provider
// Extracts instructions from existing agents and defines handoff structure

import { triageAgent } from '../../agents/triageAgent.js';
import { creditAgent } from '../../agents/creditAgent.js';
import { creditInterviewAgent } from '../../agents/creditInterviewAgent.js';
import { exchangeAgent } from '../../agents/exchangeAgent.js';

export interface AgentConfig {
  name: string;
  model: string;
  instructions: string;
  tools: string[];
  handoffs: string[];
}

// Extract instructions from existing agents and map to OpenRouter format
export const agentConfigs: Record<string, AgentConfig> = {
  full: {
    name: triageAgent.name,
    model: 'openai/gpt-4o-mini',
    instructions: typeof triageAgent.instructions === 'string' ? triageAgent.instructions : '',
    tools: ['validateCustomer', 'endConversation'],
    handoffs: ['credit', 'exchange'],
  },
  triage: {
    name: triageAgent.name,
    model: 'openai/gpt-4o-mini',
    instructions: typeof triageAgent.instructions === 'string' ? triageAgent.instructions : '',
    tools: ['validateCustomer', 'endConversation'],
    handoffs: ['credit', 'exchange'],
  },
  credit: {
    name: creditAgent.name,
    model: 'openai/gpt-4o-mini',
    instructions: typeof creditAgent.instructions === 'string' ? creditAgent.instructions : '',
    tools: ['queryCredit', 'requestCreditIncrease', 'endConversation'],
    handoffs: ['credit-interview', 'triage'],
  },
  'credit-interview': {
    name: creditInterviewAgent.name,
    model: 'openai/gpt-4o-mini',
    instructions: typeof creditInterviewAgent.instructions === 'string' ? creditInterviewAgent.instructions : '',
    tools: ['conductInterview', 'endConversation'],
    handoffs: ['credit'],
  },
  exchange: {
    name: exchangeAgent.name,
    model: 'openai/gpt-4o-mini',
    instructions: typeof exchangeAgent.instructions === 'string' ? exchangeAgent.instructions : '',
    tools: ['fetchExchangeRate', 'endConversation'],
    handoffs: ['triage'],
  },
};
