import { atom } from 'nanostores';
import { commandAPI } from './api';
import { wsClient } from './websocket';

export interface ActionRunnerState {
  running: boolean;
  currentCommand: string | null;
  output: string;
}

export class ActionRunner {
  #state = atom<ActionRunnerState>({
    running: false,
    currentCommand: null,
    output: '',
  });

  constructor() {
    // Подписываемся на сообщения команд
    wsClient.onMessage('command', (message) => {
      switch (message.action) {
        case 'output':
          this.#state.set({
            ...this.#state.get(),
            output: this.#state.get().output + message.payload.data,
          });
          break;
        case 'exit':
          this.#state.set({
            ...this.#state.get(),
            running: false,
            currentCommand: null,
          });
          break;
      }
    });
  }

  async runCommand(command: string, cwd: string) {
    try {
      // Сбрасываем состояние
      this.#state.set({
        running: true,
        currentCommand: command,
        output: '',
      });

      // Запускаем команду на сервере
      const result = await commandAPI.execute(command, cwd);
      
      if (!result.success) {
        throw new Error('Failed to execute command');
      }

      return this.#state.get().output;
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    } finally {
      this.#state.set({
        ...this.#state.get(),
        running: false,
        currentCommand: null,
      });
    }
  }

  getState() {
    return this.#state.get();
  }

  subscribe(callback: (state: ActionRunnerState) => void) {
    return this.#state.subscribe(callback);
  }
}
