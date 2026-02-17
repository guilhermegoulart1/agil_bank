// Indicador de digitacao (animacao de pontos enquanto o agente processa)

export function TypingIndicator() {
  return (
    <div className="message-row message-assistant">
      <div className="message-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="22" x2="21" y2="22"></line>
          <line x1="6" y1="18" x2="6" y2="11"></line>
          <line x1="10" y1="18" x2="10" y2="11"></line>
          <line x1="14" y1="18" x2="14" y2="11"></line>
          <line x1="18" y1="18" x2="18" y2="11"></line>
          <polygon points="12 2 20 7 4 7"></polygon>
          <line x1="2" y1="18" x2="22" y2="18"></line>
        </svg>
      </div>
      <div className="bubble-assistant typing-bubble">
        <div className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
}
