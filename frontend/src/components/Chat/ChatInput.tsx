// Campo de entrada de texto com botao de enviar

import { useState, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [texto, setTexto] = useState('');

  const handleEnviar = () => {
    if (texto.trim() && !isLoading) {
      onSend(texto.trim());
      setTexto('');
    }
  };

  const handleTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <input
          type="text"
          className="chat-input"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleTecla}
          placeholder="Digite sua mensagem..."
          disabled={isLoading}
          autoFocus
        />
        <button
          className="btn-send"
          onClick={handleEnviar}
          disabled={!texto.trim() || isLoading}
          title="Enviar mensagem"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}
