// View principal de documentação com navegação por tabs

import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import { CsvViewer } from '../CSV/CsvViewer.js';

type TabType = 'readme' | 'csv';

export function DocumentationView() {
  const [activeTab, setActiveTab] = useState<TabType>('readme');

  return (
    <div className="documentation-view">
      {/* Header com Tabs */}
      <div className="documentation-header">
        <div className="documentation-tabs">
          <button
            className={`doc-tab ${activeTab === 'readme' ? 'active' : ''}`}
            onClick={() => setActiveTab('readme')}
          >
            📄 Documentação
          </button>
          <button
            className={`doc-tab ${activeTab === 'csv' ? 'active' : ''}`}
            onClick={() => setActiveTab('csv')}
          >
            📊 Dados CSV
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="documentation-content-wrapper">
        {activeTab === 'readme' ? (
          <MarkdownRenderer />
        ) : (
          <CsvViewer />
        )}
      </div>
    </div>
  );
}
