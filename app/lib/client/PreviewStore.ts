import { map } from 'nanostores';
import { previewAPI } from './api';
import { createScopedLogger } from '~/utils/logger';
import { wsClient } from './websocket';

const logger = createScopedLogger('PreviewStore');

export interface PreviewState {
  port: number | null;
  isConnected: boolean;
  error: string | null;
}

export class PreviewStore {
  #state = map<PreviewState>({
    port: null,
    isConnected: false,
    error: null,
  });

  get state() {
    return this.#state;
  }

  constructor() {
    // Подписываемся на сообщения превью
    wsClient.onMessage('preview', (message) => {
      switch (message.action) {
        case 'refresh':
          window.location.reload();
          break;
        case 'error':
          console.error('Preview error:', message.payload);
          break;
      }
    });
  }

  async startPreview(port: number = 3001) {
    try {
      // Запускаем превью на сервере
      const result = await previewAPI.startPreview(port);
      
      if (!result.success) {
        throw new Error('Failed to start preview');
      }

      const actualPort = result.data?.port;
      if (!actualPort) {
        throw new Error('No port returned from server');
      }

      this.#state.set({
        port: actualPort,
        isConnected: true,
        error: null,
      });

      logger.info(`Preview started on port ${actualPort}`);
      return true;
    } catch (error) {
      logger.error('Failed to start preview:', error);

      this.#state.set({
        port: null,
        isConnected: false,
        error: String(error),
      });

      return false;
    }
  }

  refresh() {
    const { port } = this.#state.get();
    if (port) {
      wsClient.send({
        type: 'preview',
        action: 'refresh',
        payload: { port },
      });
    }
  }

  stopPreview() {
    this.#state.set({
      port: null,
      isConnected: false,
      error: null,
    });
  }

  getState() {
    return this.#state.get();
  }

  subscribe(callback: (state: PreviewState) => void) {
    return this.#state.subscribe(callback);
  }
}
