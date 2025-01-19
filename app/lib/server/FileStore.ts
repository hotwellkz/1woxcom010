import { mkdir, writeFile } from 'node:fs/promises';
import { relative, dirname } from 'node:path';
import { atom } from 'nanostores';

export interface FileStoreState {
  files: Map<string, string>;
  workdir: string;
}

export class FileStore {
  #state = atom<FileStoreState>({
    files: new Map(),
    workdir: process.env.WORKDIR || '/tmp/workdir'
  });

  async writeFile(filePath: string, content: string) {
    try {
      const relativePath = relative(this.#state.get().workdir, filePath);
      const fullPath = `${this.#state.get().workdir}/${relativePath}`;
      
      // Create directory if it doesn't exist
      await mkdir(dirname(fullPath), { recursive: true });
      
      // Write file
      await writeFile(fullPath, content);
      
      // Update state
      const files = new Map(this.#state.get().files);
      files.set(relativePath, content);
      this.#state.set({ ...this.#state.get(), files });
      
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  // Другие методы для работы с файлами будут добавлены позже
}
