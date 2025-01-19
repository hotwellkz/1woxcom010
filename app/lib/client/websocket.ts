import { atom } from 'nanostores';

export interface WebSocketMessage {
  type: 'terminal' | 'preview';
  action: string;
  payload: any;
}

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

export class WebSocketClient {
  #socket: WebSocket | null = null;
  #state = atom<WebSocketState>({
    connected: false,
    reconnecting: false,
    error: null,
  });
  #messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();
  #reconnectAttempts = 0;
  #maxReconnectAttempts = 5;
  #reconnectTimeout = 1000;

  connect() {
    if (this.#socket?.readyState === WebSocket.OPEN) return;

    this.#state.set({ ...this.#state.get(), reconnecting: true });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.#socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    this.#socket.onopen = () => {
      console.log('WebSocket connected');
      this.#state.set({
        connected: true,
        reconnecting: false,
        error: null,
      });
      this.#reconnectAttempts = 0;
    };

    this.#socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.#state.set({
        ...this.#state.get(),
        connected: false,
      });
      this.#reconnect();
    };

    this.#socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.#state.set({
        ...this.#state.get(),
        error: 'WebSocket connection error',
      });
    };

    this.#socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const handler = this.#messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
  }

  #reconnect() {
    if (this.#reconnectAttempts >= this.#maxReconnectAttempts) {
      this.#state.set({
        ...this.#state.get(),
        error: 'Failed to reconnect after multiple attempts',
      });
      return;
    }

    this.#reconnectAttempts++;
    this.#state.set({ ...this.#state.get(), reconnecting: true });

    setTimeout(() => {
      this.connect();
    }, this.#reconnectTimeout * this.#reconnectAttempts);
  }

  send(message: WebSocketMessage) {
    if (this.#socket?.readyState === WebSocket.OPEN) {
      this.#socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  onMessage(type: string, handler: (message: WebSocketMessage) => void) {
    this.#messageHandlers.set(type, handler);
  }

  getState() {
    return this.#state.get();
  }

  subscribe(callback: (state: WebSocketState) => void) {
    return this.#state.subscribe(callback);
  }
}

// Создаем единственный экземпляр WebSocket клиента
export const wsClient = new WebSocketClient();
