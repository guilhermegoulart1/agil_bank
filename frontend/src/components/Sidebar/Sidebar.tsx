// Sidebar com selecao de agente e botao de novo chat

import { useState } from 'react';
import type { AgentMode } from '../../types/index.js';
import { DocumentationModal } from '../Layout/DocumentationModal.js';

interface SidebarProps {
  agentModes: AgentMode[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ agentModes, selectedAgentId, onSelectAgent, onNewChat }: SidebarProps) {
  const [showDocModal, setShowDocModal] = useState(false);
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
        <button className="btn-new-chat" onClick={onNewChat}>
          + Novo Chat
        </button>
      </div>

      {/* Lista de agentes */}
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

      {/* Divisor */}
      <div className="sidebar-divider" />

      {/* Documentacao */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Recursos</div>
      </div>
      <div className="sidebar-docs">
        <div
          className="sidebar-doc-item"
          onClick={() => setShowDocModal(true)}
        >
          <span className="doc-icon">📚</span>
          <div className="doc-info">
            <div className="doc-name">Documentação</div>
            <div className="doc-desc">Guia completo do projeto</div>
          </div>
        </div>
      </div>

      {/* Modal de Documentacao */}
      <DocumentationModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
      />
    </aside>
  );
}
