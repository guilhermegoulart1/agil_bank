// App principal - Layout de 3 paineis: Sidebar | Chat | Log Panel

import { useState, useCallback } from 'react';
import { ChatContainer } from './components/Chat/ChatContainer.js';
import { Sidebar } from './components/Sidebar/Sidebar.js';
import { LogPanel } from './components/LogPanel/LogPanel.js';
import { agentModes } from './config/agentModes.js';
import type { LogData } from './types/index.js';
import './styles/globals.css';
import './styles/layout.css';

function App() {
  const [selectedAgentId, setSelectedAgentId] = useState('full');
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const [logs, setLogs] = useState<LogData[]>([]);
  // Key para forcar remount do ChatContainer quando muda o agente
  const [chatKey, setChatKey] = useState(0);

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setLogs([]);
    setChatKey((prev) => prev + 1); // Forca novo chat ao trocar agente
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
      />
      <div className="chat-panel">
        <ChatContainer
          key={chatKey}
          agentId={selectedAgentId}
          agentMode={selectedMode}
          onToggleLogs={handleToggleLogs}
          logPanelOpen={logPanelOpen}
          onLogsUpdate={handleLogsUpdate}
        />
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
