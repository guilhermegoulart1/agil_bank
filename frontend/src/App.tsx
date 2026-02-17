// App principal - Layout de 3 paineis: Sidebar | Chat | Log Panel

import { useState, useCallback, useEffect } from 'react';
import { ChatContainer } from './components/Chat/ChatContainer.js';
import { Sidebar } from './components/Sidebar/Sidebar.js';
import { LogPanel } from './components/LogPanel/LogPanel.js';
import { DocumentationView } from './components/Documentation/DocumentationView.js';
import { LoginPage } from './components/Login/LoginPage.js';
import { agentModes } from './config/agentModes.js';
import { validateToken, logout as apiLogout } from './api/authApi.js';
import { setAuthToken } from './api/chatApi.js';
import type { LogData, ViewType } from './types/index.js';
import './styles/globals.css';
import './styles/layout.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authToken, setAuthTokenState] = useState<string | null>(null);

  const [selectedAgentId, setSelectedAgentId] = useState('full');
  const [selectedProvider, setSelectedProvider] = useState('openai-agents');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [chatKey, setChatKey] = useState(0);

  // Verificar token existente ao carregar
  useEffect(() => {
    const storedToken = sessionStorage.getItem('bancoagil_token');
    if (storedToken) {
      validateToken(storedToken).then((result) => {
        if (result.valid) {
          setAuthTokenState(storedToken);
          setAuthToken(storedToken);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('bancoagil_token');
        }
        setIsCheckingAuth(false);
      });
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLoginSuccess = useCallback((token: string) => {
    sessionStorage.setItem('bancoagil_token', token);
    setAuthTokenState(token);
    setAuthToken(token);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    if (authToken) {
      apiLogout(authToken);
    }
    sessionStorage.removeItem('bancoagil_token');
    setAuthToken(null);
    setAuthTokenState(null);
    setIsAuthenticated(false);
  }, [authToken]);

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setLogs([]);
    setChatKey((prev) => prev + 1);
  }, []);

  const handleProviderChange = useCallback((provider: string) => {
    setSelectedProvider(provider);
    setLogs([]);
    setChatKey((prev) => prev + 1);
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    setLogs([]);
    setChatKey((prev) => prev + 1);
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

  // Loading inicial
  if (isCheckingAuth) {
    return <div className="auth-loading">Verificando sessao...</div>;
  }

  // Tela de login
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

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
        onLogout={handleLogout}
        selectedProvider={selectedProvider}
        onProviderChange={handleProviderChange}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        providerDisabled={logs.length > 0}
      />
      <div className="chat-panel">
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
