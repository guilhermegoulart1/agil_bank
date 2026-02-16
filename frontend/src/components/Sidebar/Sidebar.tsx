// Sidebar com selecao de agente e botao de novo chat

import type { AgentMode, ViewType } from '../../types/index.js';

interface SidebarProps {
  agentModes: AgentMode[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onNewChat: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({ agentModes, selectedAgentId, onSelectAgent, onNewChat, currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Branding */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">BA</div>
          <div>
            <div className="sidebar-title">Banco Agil</div>
            <div className="sidebar-subtitle">Atendimento IA</div>
          </div>
        </div>
        {currentView === 'chat' && (
          <button className="btn-new-chat" onClick={onNewChat}>
            + Novo Chat
          </button>
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
        <button
          className={`nav-button ${currentView === 'documentation' ? 'active' : ''}`}
          onClick={() => onViewChange('documentation')}
        >
          📚 Documentação
        </button>
      </div>

      <div className="sidebar-divider"></div>

      {/* Lista de agentes (apenas visível em modo chat) */}
      {currentView === 'chat' && (
        <>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Agentes</div>
          </div>
          <ul className="sidebar-agents">
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
        </>
      )}
    </aside>
  );
}
