import { atom } from 'nanostores';
import { spawn } from 'node:child_process';
import type { WebSocket } from 'ws';

export interface TerminalState {
  terminals: Map<string, {
    id: string;
    process: any;
    clients: Set<WebSocket>;
  }>;
}

export class TerminalStore {
  #state = atom<TerminalState>({
    terminals: new Map()
  });

  async createTerminal(id: string) {
    try {
      // Запускаем bash или cmd в зависимости от ОС
      const shell = process.platform === 'win32' ? 'cmd' : 'bash';
      const process = spawn(shell, [], {
        cwd: process.env.WORKDIR || '/tmp/workdir',
        shell: true
      });

      // Создаем набор клиентов
      const clients = new Set<WebSocket>();

      // Обрабатываем вывод процесса
      process.stdout.on('data', (data) => {
        // Отправляем данные всем подключенным клиентам
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'terminal',
              action: 'data',
              payload: {
                terminalId: id,
                data: data.toString(),
              },
            }));
          }
        });
      });

      process.stderr.on('data', (data) => {
        // Отправляем ошибки всем подключенным клиентам
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'terminal',
              action: 'data',
              payload: {
                terminalId: id,
                data: data.toString(),
              },
            }));
          }
        });
      });

      // Сохраняем терминал в состоянии
      const terminals = new Map(this.#state.get().terminals);
      terminals.set(id, { id, process, clients });
      this.#state.set({ terminals });

      return true;
    } catch (error) {
      console.error('Error creating terminal:', error);
      return false;
    }
  }

  handleClientMessage(ws: WebSocket, message: any) {
    if (message.type !== 'terminal') return;

    const terminal = this.#state.get().terminals.get(message.payload.terminalId);
    if (!terminal) return;

    switch (message.action) {
      case 'connect':
        terminal.clients.add(ws);
        break;

      case 'disconnect':
        terminal.clients.delete(ws);
        break;

      case 'data':
        terminal.process.stdin.write(message.payload.data);
        break;
    }
  }

  handleClientDisconnect(ws: WebSocket) {
    // Удаляем клиента из всех терминалов
    this.#state.get().terminals.forEach((terminal) => {
      terminal.clients.delete(ws);
    });
  }
}
