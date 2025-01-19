// Базовые функции для работы с API
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// API для работы с файлами
export const filesAPI = {
  async writeFile(path: string, content: string) {
    return request('files', {
      method: 'POST',
      body: JSON.stringify({ action: 'write', path, content }),
    });
  },
};

// API для работы с терминалом
export const terminalAPI = {
  async createTerminal(id: string) {
    return request('terminal', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },
};

// API для работы с превью
export const previewAPI = {
  async startPreview(port: number) {
    return request('preview', {
      method: 'POST',
      body: JSON.stringify({ port }),
    });
  },
};

// API для выполнения команд
export const commandAPI = {
  async execute(command: string, cwd: string) {
    return request('command', {
      method: 'POST',
      body: JSON.stringify({ command, cwd }),
    });
  },
};
