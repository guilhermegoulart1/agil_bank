// Indicador de digitacao (animacao de pontos enquanto o agente processa)

export function TypingIndicator() {
  return (
    <div className="message-row message-assistant">
      <div className="message-avatar">BA</div>
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
