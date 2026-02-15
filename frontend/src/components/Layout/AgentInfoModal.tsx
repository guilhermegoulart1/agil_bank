// Modal com informacoes detalhadas sobre o agente ativo

import type { AgentMode } from '../../types/index.js';

interface AgentInfoModalProps {
  agentMode: AgentMode;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentInfoModal({ agentMode, isOpen, onClose }: AgentInfoModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <span className="modal-icon">{agentMode.icon}</span>
            <div>
              <h2 className="modal-title">{agentMode.label}</h2>
              <p className="modal-subtitle">{agentMode.description}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Fechar">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <h3 className="modal-section-title">📋 Como Testar Este Agente</h3>
          <ul className="modal-instructions">
            {agentMode.instructions.map((instrucao, idx) => (
              <li key={idx} className="modal-instruction-item">
                {instrucao}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
