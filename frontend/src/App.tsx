// App principal - Layout de 3 paineis: Sidebar | Chat | Log Panel

import { useState, useCallback } from 'react';
import { ChatContainer } from './components/Chat/ChatContainer.js';
import { Sidebar } from './components/Sidebar/Sidebar.js';
import { LogPanel } from './components/LogPanel/LogPanel.js';
import { DocumentationView } from './components/Documentation/DocumentationView.js';
import { ProviderSelector } from './components/ProviderSelector/ProviderSelector.js';
import { agentModes } from './config/agentModes.js';
import type { LogData, ViewType } from './types/index.js';
import './styles/globals.css';
import './styles/layout.css';

function App() {
  const [selectedAgentId, setSelectedAgentId] = useState('full');
  const [selectedProvider, setSelectedProvider] = useState('openai-agents');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  // Key para forcar remount do ChatContainer quando muda o agente ou provider
  const [chatKey, setChatKey] = useState(0);

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setLogs([]);
    setChatKey((prev) => prev + 1); // Forca novo chat ao trocar agente
  }, []);

  const handleProviderChange = useCallback((provider: string) => {
    setSelectedProvider(provider);
    setLogs([]);
    setChatKey((prev) => prev + 1); // Forca novo chat ao trocar provider
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    setLogs([]);
    setChatKey((prev) => prev + 1); // Forca novo chat ao trocar modelo
  }, []);

  const handleNewChat = useCallback(() => {
    setLogs([]);
    setChatKey((prev) => prev + 1);
  }, []);

  const handleToggleLogs = useCallback(() => {
    setLogPanelOpen((prev) => !prev);
  }, []);

  const handleCloseLogs = useCallback(() => {
    setLogPanelOpen(false);
  }, []);

  const handleLogsUpdate = useCallback((newLogs: LogData[]) => {
    setLogs(newLogs);
  }, []);

  // Encontra o modo de agente selecionado
  const selectedMode = agentModes.find((m) => m.id === selectedAgentId) || agentModes[0];

  return (
    <div className="app-layout">
      <Sidebar
        agentModes={agentModes}
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        onNewChat={handleNewChat}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <div className="chat-panel">
        {/* Provider Selector */}
        <div className="provider-selector-container">
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={handleProviderChange}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            disabled={logs.length > 0}
          />
        </div>

        {currentView === 'chat' ? (
          <ChatContainer
            key={`${chatKey}-${selectedProvider}-${selectedModel}`}
            agentId={selectedAgentId}
            agentMode={selectedMode}
            provider={selectedProvider}
            model={selectedModel}
            onToggleLogs={handleToggleLogs}
            logPanelOpen={logPanelOpen}
            onLogsUpdate={handleLogsUpdate}
          />
        ) : (
          <DocumentationView />
        )}
      </div>
      <LogPanel
        logs={logs}
        isOpen={logPanelOpen}
        onClose={handleCloseLogs}
      />
    </div>
  );
}

export default App;
