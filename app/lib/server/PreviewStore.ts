import { atom } from 'nanostores';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PreviewStore');

export interface PreviewState {
  port: number | null;
  server: any;
  clients: Set<WebSocket>;
}

export class PreviewStore {
  #state = atom<PreviewState>({
    port: null,
    server: null,
    clients: new Set(),
  });

  async findAvailablePort(startPort: number): Promise<number> {
    const isPortAvailable = (port: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const server = createServer();
        server.listen(port, () => {
          server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
      });
    };

    let port = startPort;
    while (!(await isPortAvailable(port))) {
      port++;
      if (port > startPort + 100) {
        throw new Error('No available ports found');
      }
    }
    return port;
  }

  async startPreviewServer(port: number = 3001) {
    try {
      // Закрываем предыдущий сервер, если он есть
      const currentState = this.#state.get();
      if (currentState.server) {
        currentState.server.close();
      }

      // Ищем свободный порт
      const availablePort = await this.findAvailablePort(port);
      logger.info(`Starting preview server on port ${availablePort}`);

      // Создаем HTTP сервер
      const server = createServer((req, res) => {
        // Здесь будет логика для отдачи файлов
        res.writeHead(200);
        res.end('Preview server running');
      });

      // Создаем WebSocket сервер
      const wss = new WebSocketServer({ server });

      wss.on('connection', (ws) => {
        ws.on('message', (message) => {
          this.handleClientMessage(ws, JSON.parse(message));
        });

        ws.on('close', () => {
          this.handleClientDisconnect(ws);
        });
      });

      // Запускаем сервер
      server.listen(availablePort);

      this.#state.set({
        port: availablePort,
        server,
        clients: new Set(),
      });

      logger.info(`Preview server started on port ${availablePort}`);
      return availablePort;
    } catch (error) {
      logger.error('Failed to start preview server', error);
      throw error;
    }
  }

  handleClientMessage(ws: WebSocket, message: any) {
    if (message.type !== 'preview') return;

    const state = this.#state.get();
    if (!state.port) return;

    switch (message.action) {
      case 'connect':
        state.clients.add(ws);
        break;

      case 'disconnect':
        state.clients.delete(ws);
        break;

      case 'refresh':
        // Отправляем команду обновления всем клиентам
        state.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'preview',
              action: 'refresh',
            }));
          }
        });
        break;
    }
  }

  handleClientDisconnect(ws: WebSocket) {
    const state = this.#state.get();
    state.clients.delete(ws);
  }

  stopPreviewServer() {
    const state = this.#state.get();
    if (state.server) {
      state.server.close();
      this.#state.set({
        port: null,
        server: null,
        clients: new Set(),
      });
    }
  }
}
