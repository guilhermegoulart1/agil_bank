// Cabecalho com nome do agente ativo, botao de ajuda e toggle de logs

import { useState } from 'react';
import type { AgentMode } from '../../types/index.js';
import { AgentInfoModal } from './AgentInfoModal.js';

interface HeaderProps {
  agentMode: AgentMode;
  onToggleLogs: () => void;
  logPanelOpen: boolean;
}

export function Header({ agentMode, onToggleLogs, logPanelOpen }: HeaderProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">BA</div>
            <div className="header-text">
              <div className="header-title-row">
                <h1 className="header-title">{agentMode.label}</h1>
                <button
                  className="btn-help"
                  onClick={() => setShowInfoModal(true)}
                  title="Como testar este agente"
                >
                  ?
                </button>
              </div>
              <p className="header-subtitle">{agentMode.description}</p>
            </div>
          </div>
          <button
            className="btn-reset"
            onClick={onToggleLogs}
            title={logPanelOpen ? 'Fechar logs' : 'Abrir logs'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            {logPanelOpen ? 'Fechar Logs' : 'Ver Logs'}
          </button>
        </div>
      </header>

      <AgentInfoModal
        agentMode={agentMode}
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
}
