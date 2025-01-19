import { atom, map, type MapStore } from 'nanostores';
import * as nodePath from 'node:path';
import type { ActionAlert, BoltAction } from '~/types/actions';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
import type { ActionCallbackData } from './message-parser';
import type { BoltShell } from '~/utils/shell';
import { nanoid } from 'nanoid';
import { shell } from '~/utils/shell';
import { actionRunner } from '~/lib/client';

const logger = createScopedLogger('ActionRunner');

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export type BaseActionState = BoltAction & {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
};

export type FailedActionState = BoltAction &
  Omit<BaseActionState, 'status'> & {
    status: Extract<ActionStatus, 'failed'>;
    error: string;
  };

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

type ActionsMap = MapStore<Record<string, ActionState>>;

class ActionCommandError extends Error {
  readonly _output: string;
  readonly _header: string;

  constructor(message: string, output: string) {
    const formattedMessage = `Failed To Execute Shell Command: ${message}\n\nOutput:\n${output}`;
    super(formattedMessage);
    this._header = message;
    this._output = output;
    Object.setPrototypeOf(this, ActionCommandError.prototype);
  }

  get output() {
    return this._output;
  }

  get header() {
    return this._header;
  }
}

export interface ActionRunnerState {
  runnerId: string;
  running: boolean;
  currentAction: string | null;
}

export class ActionRunner {
  #currentExecutionPromise: Promise<void> = Promise.resolve();
  #shellTerminal: () => BoltShell;
  #state = atom<ActionRunnerState>({
    runnerId: nanoid(),
    running: false,
    currentAction: null,
  });

  runnerId = atom<string>(`${Date.now()}`);
  actions: ActionsMap = map({});
  onAlert?: (alert: ActionAlert) => void;

  constructor(
    getShellTerminal: () => BoltShell,
    onAlert?: (alert: ActionAlert) => void,
  ) {
    this.#shellTerminal = getShellTerminal;
    this.onAlert = onAlert;
  }

  getState() {
    return this.#state.get();
  }

  subscribe(callback: (state: ActionRunnerState) => void) {
    return this.#state.subscribe(callback);
  }

  async addAction(data: ActionCallbackData) {
    const { action } = data;
    const abortController = new AbortController();

    this.actions.setKey(action.id, {
      ...action,
      status: 'pending',
      abort: () => abortController.abort(),
      executed: false,
      abortSignal: abortController.signal,
    });

    return this.runAction(data);
  }

  async abort() {
    const state = this.#state.get();
    if (state.currentAction) {
      const action = this.actions.get()[state.currentAction];
      if (action) {
        action.abort();
      }
    }
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { action } = data;
    const state = this.#state.get();

    if (state.running) {
      throw new Error('Action runner is already running');
    }

    this.#state.set({
      ...state,
      running: true,
      currentAction: action.id,
    });

    try {
      await this.executeAction(data, isStreaming);

      this.#state.set({
        ...this.#state.get(),
        running: false,
        currentAction: null,
      });
    } catch (error) {
      this.#state.set({
        ...this.#state.get(),
        running: false,
        currentAction: null,
      });
      throw error;
    }
  }

  private async executeAction(data: ActionCallbackData, isStreaming: boolean) {
    const { action } = data;
    const actionState = this.actions.get()[action.id];

    if (!actionState) {
      throw new Error(`Action ${action.id} not found`);
    }

    try {
      this.actions.setKey(action.id, {
        ...actionState,
        status: 'running',
      });

      const shell = this.#shellTerminal();
      await shell.execute(action.command, {
        cwd: action.cwd,
        signal: actionState.abortSignal,
        streaming: isStreaming,
      });

      this.actions.setKey(action.id, {
        ...actionState,
        status: 'complete',
        executed: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.actions.setKey(action.id, {
          ...actionState,
          status: 'failed',
          error: error.message,
        });
      }
      throw error;
    }
  }
}
