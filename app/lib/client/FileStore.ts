import { atom } from 'nanostores';
import { filesAPI } from './api';

export interface FileStoreState {
  files: Map<string, string>;
}

export class FileStore {
  #state = atom<FileStoreState>({
    files: new Map(),
  });

  async writeFile(filePath: string, content: string) {
    try {
      const result = await filesAPI.writeFile(filePath, content);
      
      if (result.success) {
        // Обновляем локальное состояние
        const files = new Map(this.#state.get().files);
        files.set(filePath, content);
        this.#state.set({ files });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  getState() {
    return this.#state.get();
  }

  subscribe(callback: (state: FileStoreState) => void) {
    return this.#state.subscribe(callback);
  }
}
