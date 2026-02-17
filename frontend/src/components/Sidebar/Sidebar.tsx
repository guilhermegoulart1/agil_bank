// Sidebar com selecao de agente, provider e botao de novo chat

import { useState } from 'react';
import type { AgentMode, ViewType } from '../../types/index.js';
import { ProviderSelector, getProviderLabel } from '../ProviderSelector/ProviderSelector.js';

interface SidebarProps {
  agentModes: AgentMode[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onNewChat: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  providerDisabled: boolean;
}

export function Sidebar({ agentModes, selectedAgentId, onSelectAgent, onNewChat, currentView, onViewChange, onLogout, selectedProvider, onProviderChange, selectedModel, onModelChange, providerDisabled }: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside className="sidebar">
      {/* Branding */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="22" x2="21" y2="22"></line>
              <line x1="6" y1="18" x2="6" y2="11"></line>
              <line x1="10" y1="18" x2="10" y2="11"></line>
              <line x1="14" y1="18" x2="14" y2="11"></line>
              <line x1="18" y1="18" x2="18" y2="11"></line>
              <polygon points="12 2 20 7 4 7"></polygon>
              <line x1="2" y1="18" x2="22" y2="18"></line>
            </svg>
          </div>
          <div>
            <div className="sidebar-title">Banco Agil</div>
            <div className="sidebar-subtitle">Atendimento IA</div>
          </div>
          <button
            className="btn-settings"
            onClick={() => setShowSettings(true)}
            title="Configurações"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
        {currentView === 'chat' && (
          <>
            <button className="btn-new-chat" onClick={onNewChat}>
              + Novo Chat
            </button>
            <div className="sidebar-provider-info">
              {getProviderLabel(selectedProvider)}
            </div>
          </>
        )}
      </div>

      {/* Navegação Principal */}
      <div className="sidebar-navigation">
        <button
          className={`nav-button ${currentView === 'chat' ? 'active' : ''}`}
          onClick={() => onViewChange('chat')}
        >
          💬 Chat
        </button>

        {/* Agentes como sub-opções do Chat */}
        {currentView === 'chat' && (
          <ul className="sidebar-agents sidebar-agents-nested">
            {agentModes.map((mode) => (
              <li
                key={mode.id}
                className={`sidebar-agent-item ${selectedAgentId === mode.id ? 'active' : ''}`}
                onClick={() => onSelectAgent(mode.id)}
              >
                <span className="agent-icon">{mode.icon}</span>
                <div className="agent-info">
                  <div className="agent-name">{mode.label}</div>
                  <div className="agent-desc">{mode.description}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          className={`nav-button ${currentView === 'documentation' ? 'active' : ''}`}
          onClick={() => onViewChange('documentation')}
        >
          📚 Documentação
        </button>
      </div>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={onLogout}>
          Sair
        </button>
      </div>

      {/* Modal de Configurações */}
      {showSettings && (
        <>
          <div className="modal-overlay" onClick={() => setShowSettings(false)} />
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-header-content">
                <span className="modal-icon">&#9881;</span>
                <div>
                  <h2 className="modal-title">Configurações</h2>
                  <p className="modal-subtitle">Selecione o provedor de IA</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowSettings(false)} title="Fechar">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <ProviderSelector
                selectedProvider={selectedProvider}
                onProviderChange={onProviderChange}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                disabled={providerDisabled}
              />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
