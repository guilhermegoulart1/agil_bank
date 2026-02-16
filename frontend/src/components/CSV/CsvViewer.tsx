// Visualizador de CSV com navegacao por abas

import { useEffect, useState } from 'react';
import { CsvTable } from './CsvTable.js';
import type { CsvData } from '../../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

type CsvFilename = 'clientes' | 'score_limite' | 'solicitacoes_aumento_limite';

interface TabConfig {
  id: CsvFilename;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'score_limite', label: 'Score/Limite' },
  { id: 'solicitacoes_aumento_limite', label: 'Solicitações' },
];

export function CsvViewer() {
  const [activeTab, setActiveTab] = useState<CsvFilename>('clientes');
  const [data, setData] = useState<Record<string, CsvData | null>>({
    clientes: null,
    score_limite: null,
    solicitacoes_aumento_limite: null,
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    clientes: false,
    score_limite: false,
    solicitacoes_aumento_limite: false,
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({
    clientes: null,
    score_limite: null,
    solicitacoes_aumento_limite: null,
  });

  const fetchCsvData = async (filename: CsvFilename) => {
    // Se ja carregou, nao busca novamente (cache)
    if (data[filename]) return;

    setLoading((prev) => ({ ...prev, [filename]: true }));
    try {
      const response = await fetch(`${API_BASE}/csv/${filename}`);
      if (!response.ok) throw new Error('Erro ao carregar CSV');

      const csvText = await response.text();
      const lines = csvText.trim().split('\n');

      if (lines.length === 0) {
        throw new Error('Arquivo CSV vazio');
      }

      const headers = lines[0].split(',');
      const rows = lines.slice(1).map((line) => line.split(','));

      setData((prev) => ({ ...prev, [filename]: { headers, rows } }));
      setErrors((prev) => ({ ...prev, [filename]: null }));
    } catch (err) {
      console.error(`Erro ao carregar CSV ${filename}:`, err);
      setErrors((prev) => ({ ...prev, [filename]: 'Erro ao carregar dados' }));
    } finally {
      setLoading((prev) => ({ ...prev, [filename]: false }));
    }
  };

  useEffect(() => {
    fetchCsvData(activeTab);
  }, [activeTab]);

  const currentData = data[activeTab];
  const currentLoading = loading[activeTab];
  const currentError = errors[activeTab];

  return (
    <div className="csv-viewer-section">
      <div className="csv-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`csv-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CsvTable
        headers={currentData?.headers || []}
        rows={currentData?.rows || []}
        loading={currentLoading}
        error={currentError}
      />
    </div>
  );
}
