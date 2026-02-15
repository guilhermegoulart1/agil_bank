// Lista de mensagens com auto-scroll e welcome screen dinamico por agente

import { useEffect, useRef } from 'react';
import type { Message, AgentMode } from '../../types/index.js';
import { MessageBubble } from './MessageBubble.js';
import { TypingIndicator } from './TypingIndicator.js';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  agentMode: AgentMode;
}

// Textos explicativos expandidos para cada agente
const agentExplanations: Record<string, string> = {
  full: 'Este é o fluxo completo do Banco Ágil, onde todos os 4 agentes trabalham em conjunto de forma transparente. Você será autenticado pelo Agente de Triagem e automaticamente direcionado para o setor mais adequado à sua necessidade (Crédito ou Câmbio). As transições entre agentes acontecem de forma invisível - você conversa com um único assistente inteligente.',
  triage: 'O Agente de Triagem é responsável pela autenticação do cliente no sistema. Ele valida seu CPF e data de nascimento contra a base de dados de clientes (clientes.csv) e permite até 3 tentativas. Após autenticado com sucesso, ele identifica sua necessidade e direciona você para o Agente de Crédito ou Agente de Câmbio.',
  credit: 'O Agente de Crédito permite consultar seu limite e score de crédito atuais, além de processar solicitações de aumento de limite. Quando você solicita um aumento, o sistema verifica se seu score permite o novo limite desejado (baseado na tabela score_limite.csv). Se aprovado, seu limite é atualizado. Se rejeitado, o agente oferece uma Entrevista de Crédito para melhorar seu score.',
  'credit-interview': 'O Agente de Entrevista conduz uma entrevista financeira estruturada com 5 perguntas (uma de cada vez): renda mensal, tipo de emprego, despesas fixas, número de dependentes e existência de dívidas ativas. Com essas informações, calcula um novo score usando uma fórmula ponderada e atualiza seu cadastro. Após a entrevista, você é automaticamente redirecionado ao Agente de Crédito para uma nova análise.',
  exchange: 'O Agente de Câmbio consulta cotações de moedas estrangeiras em tempo real através da AwesomeAPI (API brasileira gratuita). Você pode consultar a cotação de diversas moedas: USD (Dólar), EUR (Euro), GBP (Libra), ARS (Peso Argentino), CAD, AUD, JPY, CNY e até BTC (Bitcoin). O agente apresenta valores de compra, venda e variação percentual do dia.',
};

export function MessageList({ messages, isLoading, agentMode }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novas mensagens chegam
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="message-list">
      {messages.length === 0 && !isLoading && (
        <div className="welcome-screen">
          <div className="welcome-logo">{agentMode.icon}</div>
          <h2>{agentMode.label}</h2>
          <p className="welcome-description">
            {agentExplanations[agentMode.id] || agentMode.description}
          </p>
          <div className="welcome-cta">
            <p>Digite uma mensagem abaixo para iniciar o atendimento</p>
          </div>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
