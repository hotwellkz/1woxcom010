import { atom } from 'nanostores';
import type { ITerminal } from '@xterm/xterm';
import { terminalAPI } from './api';
import { wsClient } from './websocket';

export interface TerminalState {
  terminals: Map<string, {
    id: string;
    terminal: ITerminal;
  }>;
}

export class TerminalStore {
  #state = atom<TerminalState>({
    terminals: new Map(),
  });

  constructor() {
    // Подписываемся на сообщения терминала
    wsClient.onMessage('terminal', (message) => {
      if (message.action === 'data') {
        const { terminalId, data } = message.payload;
        const terminal = this.#state.get().terminals.get(terminalId);
        if (terminal) {
          terminal.terminal.write(data);
        }
      }
    });
  }

  async createTerminal(id: string, terminal: ITerminal) {
    try {
      // Создаем терминал на сервере
      const result = await terminalAPI.createTerminal(id);
      
      if (!result.success) {
        throw new Error('Failed to create terminal');
      }

      // Отправляем данные на сервер при вводе в терминал
      terminal.onData((data) => {
        wsClient.send({
          type: 'terminal',
          action: 'data',
          payload: {
            terminalId: id,
            data,
          },
        });
      });

      // Сохраняем терминал в состоянии
      const terminals = new Map(this.#state.get().terminals);
      terminals.set(id, { id, terminal });
      this.#state.set({ terminals });

      return true;
    } catch (error) {
      console.error('Error creating terminal:', error);
      return false;
    }
  }

  getTerminal(id: string) {
    return this.#state.get().terminals.get(id)?.terminal;
  }

  getState() {
    return this.#state.get();
  }

  subscribe(callback: (state: TerminalState) => void) {
    return this.#state.subscribe(callback);
  }
}
