// Modal que exibe o conteudo completo do README.md

import { DocumentationView } from '../Documentation/DocumentationView.js';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="documentation-modal">
        <div className="modal-header">
          <div className="modal-header-content">
            <span className="modal-icon">📚</span>
            <div>
              <h2 className="modal-title">Documentação Completa</h2>
              <p className="modal-subtitle">README.md do projeto</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Fechar">
            &times;
          </button>
        </div>

        <DocumentationView />
      </div>
    </>
  );
}
