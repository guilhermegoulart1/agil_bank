// Container principal do chat - orquestra todos os componentes
// Recebe agentId para selecao de agente e reporta logs ao pai

import { useEffect } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { Header } from '../Layout/Header.js';
import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';
import type { AgentMode, LogData } from '../../types/index.js';

interface ChatContainerProps {
  agentId: string;
  agentMode: AgentMode;
  provider?: string;
  model?: string;
  onToggleLogs: () => void;
  logPanelOpen: boolean;
  onLogsUpdate: (logs: LogData[]) => void;
}

export function ChatContainer({
  agentId,
  agentMode,
  provider,
  model,
  onToggleLogs,
  logPanelOpen,
  onLogsUpdate,
}: ChatContainerProps) {
  const { messages, isLoading, logs, enviar } = useChat(agentId, provider, model);

  // Reporta mudancas de logs ao componente pai (App)
  useEffect(() => {
    onLogsUpdate(logs);
  }, [logs, onLogsUpdate]);

  return (
    <div className="app-container">
      <Header
        agentMode={agentMode}
        onToggleLogs={onToggleLogs}
        logPanelOpen={logPanelOpen}
      />
      <main className="chat-main">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          agentMode={agentMode}
        />
        <ChatInput onSend={enviar} isLoading={isLoading} />
      </main>
    </div>
  );
}
