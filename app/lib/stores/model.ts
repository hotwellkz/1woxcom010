import { atom } from 'nanostores';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { ProviderInfo } from '~/types/model';

export interface ModelState {
  availableModels: ModelInfo[];
  providers: ProviderInfo[];
  selectedModel: string | null;
  selectedProvider: string | null;
  isLoading: boolean;
  error: string | null;
}

export const modelStore = atom<ModelState>({
  availableModels: [],
  providers: [],
  selectedModel: null,
  selectedProvider: null,
  isLoading: false,
  error: null,
});

export async function checkAvailableModels() {
  try {
    modelStore.set({
      ...modelStore.get(),
      isLoading: true,
      error: null,
    });

    const response = await fetch('/api/models');
    if (!response.ok) {
      throw new Error('Failed to fetch available models');
    }

    const { models, providers } = await response.json();
    
    modelStore.set({
      ...modelStore.get(),
      availableModels: models,
      providers: providers,
      isLoading: false,
    });

    // Если есть доступные модели и провайдеры, выбираем первые по умолчанию
    const state = modelStore.get();
    if (providers.length > 0 && !state.selectedProvider) {
      state.selectedProvider = providers[0].name;
    }
    if (models.length > 0 && !state.selectedModel) {
      const defaultModel = models.find(m => m.provider === state.selectedProvider);
      if (defaultModel) {
        state.selectedModel = defaultModel.id;
      }
    }
    modelStore.set(state);
  } catch (error) {
    modelStore.set({
      ...modelStore.get(),
      isLoading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function selectModel(modelId: string) {
  const state = modelStore.get();
  const model = state.availableModels.find(m => m.id === modelId);
  if (model) {
    modelStore.set({
      ...state,
      selectedModel: modelId,
      selectedProvider: model.provider,
    });
  }
}
