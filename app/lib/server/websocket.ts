import { WebSocketServer, WebSocket } from 'ws';
import { terminalStore } from './TerminalStore';
import { previewStore } from './PreviewStore';

interface WebSocketMessage {
  type: 'terminal' | 'preview';
  action: string;
  payload: any;
}

export function createWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);

        switch (message.type) {
          case 'terminal': {
            handleTerminalMessage(ws, message);
            break;
          }
          case 'preview': {
            handlePreviewMessage(ws, message);
            break;
          }
          default:
            ws.send(JSON.stringify({ error: 'Invalid message type' }));
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return wss;
}

function handleTerminalMessage(ws: WebSocket, message: WebSocketMessage) {
  switch (message.action) {
    case 'data': {
      // Отправляем данные в терминал
      const { terminalId, data } = message.payload;
      const terminal = terminalStore.getTerminal(terminalId);
      if (terminal) {
        terminal.write(data);
      }
      break;
    }
    // Добавим другие действия позже
  }
}

function handlePreviewMessage(ws: WebSocket, message: WebSocketMessage) {
  switch (message.action) {
    case 'refresh': {
      // Обновляем превью
      const { port } = message.payload;
      previewStore.refreshPreview(port);
      break;
    }
    // Добавим другие действия позже
  }
}
