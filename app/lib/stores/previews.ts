import { atom } from 'nanostores';

export interface PreviewInfo {
  port: number;
  ready: boolean;
  baseUrl: string;
}

export class PreviewsStore {
  #availablePreviews = new Map<number, PreviewInfo>();
  previews = atom<PreviewInfo[]>([]);

  constructor() {
    this.#init();
  }

  async #init() {
    // Initialize without webcontainer for now
    this.previews.set([]);
  }

  addPreview(port: number, baseUrl: string) {
    const previewInfo: PreviewInfo = {
      port,
      ready: true,
      baseUrl
    };

    this.#availablePreviews.set(port, previewInfo);
    this.previews.set([...this.previews.get(), previewInfo]);
  }

  removePreview(port: number) {
    this.#availablePreviews.delete(port);
    this.previews.set(this.previews.get().filter((preview) => preview.port !== port));
  }

  getPreview(port: number) {
    return this.#availablePreviews.get(port);
  }
}
