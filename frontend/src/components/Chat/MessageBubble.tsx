// Bolha individual de mensagem (usuario ou agente)

import type { Message } from '../../types/index.js';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const hora = message.timestamp.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`message-row ${isUser ? 'message-user' : 'message-assistant'}`}>
      {!isUser && <div className="message-avatar">BA</div>}
      <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
        <p className="message-text">{message.content}</p>
        <span className="message-time">{hora}</span>
      </div>
    </div>
  );
}
