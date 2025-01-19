export * from './websocket';
export * from './api';

import { ActionRunner } from './ActionRunner';
import { PreviewStore } from './PreviewStore';
import { TerminalStore } from './TerminalStore';
import { FileStore } from './FileStore';

// Создаем единственные экземпляры сервисов
export const actionRunner = new ActionRunner();
export const previewStore = new PreviewStore();
export const terminalStore = new TerminalStore();
export const fileStore = new FileStore();
