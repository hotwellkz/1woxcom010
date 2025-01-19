import { FileStore } from './FileStore';
import { TerminalStore } from './TerminalStore';
import { PreviewStore } from './PreviewStore';
import { ActionRunner } from './ActionRunner';

// Создаем экземпляры сервисов
export const fileStore = new FileStore();
export const terminalStore = new TerminalStore();
export const previewStore = new PreviewStore();
export const actionRunner = new ActionRunner(fileStore, terminalStore);

// Инициализируем превью сервер
previewStore.startPreviewServer(3001);
