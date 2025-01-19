import { map, type MapStore } from 'nanostores';
import { Buffer } from 'node:buffer';
import * as nodePath from 'node:path';
import { WORK_DIR } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const logger = createScopedLogger('FilesStore');

const utf8TextDecoder = new TextDecoder('utf8', { fatal: true });

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

export interface Folder {
  type: 'folder';
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export class FilesStore {
  /**
   * Tracks the number of files without folders.
   */
  #size = 0;

  /**
   * Map of files in memory
   */
  files: MapStore<FileMap> = map({});

  constructor() {
    this.#init();
  }

  get filesCount() {
    return this.#size;
  }

  async #init() {
    // Initialize with empty file system
    this.files.set({});
    this.#size = 0;
  }

  async createFile(path: string, content: string = '') {
    const normalizedPath = this.#normalizePath(path);
    
    // Create parent directories if they don't exist
    const parentDir = nodePath.dirname(normalizedPath);
    if (parentDir !== '.') {
      await this.createFolder(parentDir);
    }

    this.files.setKey(normalizedPath, {
      type: 'file',
      content,
      isBinary: false
    });

    this.#size++;
    logger.debug(`Created file ${normalizedPath}`);
  }

  async createFolder(path: string) {
    const normalizedPath = this.#normalizePath(path);
    
    if (this.files.get()[normalizedPath]?.type === 'folder') {
      return;
    }

    // Create parent directories if they don't exist
    const parentDir = nodePath.dirname(normalizedPath);
    if (parentDir !== '.') {
      await this.createFolder(parentDir);
    }

    this.files.setKey(normalizedPath, { type: 'folder' });
    logger.debug(`Created folder ${normalizedPath}`);
  }

  async readFile(path: string): Promise<string> {
    const normalizedPath = this.#normalizePath(path);
    const file = this.files.get()[normalizedPath];

    if (!file || file.type !== 'file') {
      throw new Error(`File ${normalizedPath} not found`);
    }

    return file.content;
  }

  async writeFile(path: string, content: string) {
    const normalizedPath = this.#normalizePath(path);
    const file = this.files.get()[normalizedPath];

    if (!file || file.type !== 'file') {
      await this.createFile(normalizedPath, content);
      return;
    }

    this.files.setKey(normalizedPath, {
      ...file,
      content
    });

    logger.debug(`Updated file ${normalizedPath}`);
  }

  async deleteFile(path: string) {
    const normalizedPath = this.#normalizePath(path);
    const file = this.files.get()[normalizedPath];

    if (!file) {
      return;
    }

    if (file.type === 'file') {
      this.#size--;
    }

    const files = this.files.get();
    delete files[normalizedPath];
    this.files.set(files);

    logger.debug(`Deleted ${file.type} ${normalizedPath}`);
  }

  #normalizePath(path: string): string {
    return nodePath.normalize(path).replace(/\\/g, '/');
  }
}
