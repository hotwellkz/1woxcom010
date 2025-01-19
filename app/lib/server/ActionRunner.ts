import { atom } from 'nanostores';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { WebSocket } from 'ws';

const execAsync = promisify(exec);

export interface ActionRunnerState {
  running: boolean;
  currentCommand: string | null;
  clients: Set<WebSocket>;
}

export class ActionRunner {
  #state = atom<ActionRunnerState>({
    running: false,
    currentCommand: null,
    clients: new Set(),
  });

  async runCommand(command: string, cwd: string) {
    try {
      this.#state.set({
        ...this.#state.get(),
        running: true,
        currentCommand: command,
      });

      // Отправляем уведомление о начале выполнения команды
      this.broadcastMessage({
        type: 'command',
        action: 'start',
        payload: { command },
      });

      const { stdout, stderr } = await execAsync(command, { cwd });
      
      if (stderr) {
        // Отправляем ошибки
        this.broadcastMessage({
          type: 'command',
          action: 'output',
          payload: { data: stderr },
        });
      }

      // Отправляем вывод
      this.broadcastMessage({
        type: 'command',
        action: 'output',
        payload: { data: stdout },
      });

      // Отправляем уведомление о завершении команды
      this.broadcastMessage({
        type: 'command',
        action: 'exit',
        payload: { code: 0 },
      });

      this.#state.set({
        ...this.#state.get(),
        running: false,
        currentCommand: null,
      });

      return stdout;
    } catch (error) {
      // Отправляем ошибку
      this.broadcastMessage({
        type: 'command',
        action: 'error',
        payload: { error: String(error) },
      });

      this.#state.set({
        ...this.#state.get(),
        running: false,
        currentCommand: null,
      });

      throw error;
    }
  }

  handleClientMessage(ws: WebSocket, message: any) {
    if (message.type !== 'command') return;

    switch (message.action) {
      case 'connect':
        this.#state.get().clients.add(ws);
        break;

      case 'disconnect':
        this.#state.get().clients.delete(ws);
        break;
    }
  }

  handleClientDisconnect(ws: WebSocket) {
    this.#state.get().clients.delete(ws);
  }

  private broadcastMessage(message: any) {
    this.#state.get().clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}
