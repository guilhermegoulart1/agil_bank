// Modal que exibe o conteudo completo do README.md

import { useEffect, useState } from 'react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Fetch do README.md do repositorio raiz
      fetch('/README.md')
        .then((res) => res.text())
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Erro ao carregar README:', err);
          setContent('# Erro ao carregar documentação\n\nNão foi possível carregar o arquivo README.md.');
          setLoading(false);
        });
    }
  }, [isOpen]);

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

        <div className="documentation-content">
          {loading ? (
            <div className="documentation-loading">Carregando...</div>
          ) : (
            <pre className="documentation-text">{content}</pre>
          )}
        </div>
      </div>
    </>
  );
}
