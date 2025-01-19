import type { IProviderSetting } from '~/types/model';
import { BaseProvider } from './base-provider';
import type { ModelInfo, ProviderInfo } from './types';
import * as providers from './registry';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LLMManager');

// Таймаут для получения моделей от провайдера (5 секунд)
const PROVIDER_TIMEOUT = 5000;

export class LLMManager {
  private static _instance: LLMManager;
  private _providers: Map<string, BaseProvider> = new Map();
  private _modelList: ModelInfo[] = [];
  private readonly _env: any = {};

  private constructor(_env: Record<string, string>) {
    this._registerProvidersFromDirectory();
    this._env = _env;
  }

  static getInstance(env: Record<string, string> = {}): LLMManager {
    if (!LLMManager._instance) {
      LLMManager._instance = new LLMManager(env);
    }

    return LLMManager._instance;
  }

  get env() {
    return this._env;
  }

  private async _registerProvidersFromDirectory() {
    try {
      for (const exportedItem of Object.values(providers)) {
        if (typeof exportedItem === 'function' && exportedItem.prototype instanceof BaseProvider) {
          const provider = new exportedItem();

          try {
            this.registerProvider(provider);
          } catch (error: any) {
            logger.warn('Failed To Register Provider: ', provider.name, 'error:', error.message);
          }
        }
      }
    } catch (error) {
      logger.error('Error registering providers:', error);
    }
  }

  registerProvider(provider: BaseProvider) {
    if (this._providers.has(provider.name)) {
      logger.warn(`Provider ${provider.name} is already registered. Skipping.`);
      return;
    }

    logger.info('Registering Provider: ', provider.name);
    this._providers.set(provider.name, provider);
    this._modelList = [...this._modelList, ...provider.staticModels];
  }

  getProvider(name: string): BaseProvider | undefined {
    return this._providers.get(name);
  }

  getAllProviders(): BaseProvider[] {
    return Array.from(this._providers.values());
  }

  getModelList(): ModelInfo[] {
    return this._modelList;
  }

  async updateModelList(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  }): Promise<ModelInfo[]> {
    const { apiKeys, providerSettings, serverEnv } = options;

    let enabledProviders = Array.from(this._providers.values()).map((p) => p.name);

    if (providerSettings) {
      enabledProviders = enabledProviders.filter((p) => providerSettings[p]?.enabled);
    }

    // Функция для получения моделей от провайдера с таймаутом
    const getProviderModels = async (provider: BaseProvider & Required<Pick<ProviderInfo, 'getDynamicModels'>>) => {
      const timeoutPromise = new Promise<ModelInfo[]>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout getting models from ${provider.name}`)), PROVIDER_TIMEOUT);
      });

      try {
        const cachedModels = provider.getModelsFromCache(options);
        if (cachedModels) {
          return cachedModels;
        }

        const modelsPromise = provider
          .getDynamicModels(apiKeys, providerSettings?.[provider.name], serverEnv)
          .then((models) => {
            logger.info(`Caching ${models.length} dynamic models for ${provider.name}`);
            provider.storeDynamicModels(options, models);
            return models;
          });

        const models = await Promise.race([modelsPromise, timeoutPromise]);
        return models;
      } catch (err) {
        logger.error(`Error getting dynamic models from ${provider.name}:`, err);
        return [];
      }
    };

    // Get dynamic models from all providers that support them
    const dynamicModels = await Promise.all(
      Array.from(this._providers.values())
        .filter((provider) => enabledProviders.includes(provider.name))
        .filter(
          (provider): provider is BaseProvider & Required<Pick<ProviderInfo, 'getDynamicModels'>> =>
            !!provider.getDynamicModels,
        )
        .map(getProviderModels),
    );

    // Combine static and dynamic models
    const modelList = [
      ...dynamicModels.flat(),
      ...Array.from(this._providers.values()).flatMap((p) => p.staticModels || []),
    ];
    this._modelList = modelList;

    return modelList;
  }

  getStaticModelList() {
    return [...this._providers.values()].flatMap((p) => p.staticModels || []);
  }

  async getModelListFromProvider(
    providerArg: BaseProvider,
    options: {
      apiKeys?: Record<string, string>;
      providerSettings?: Record<string, IProviderSetting>;
      serverEnv?: Record<string, string>;
    },
  ): Promise<ModelInfo[]> {
    const provider = this._providers.get(providerArg.name);

    if (!provider) {
      throw new Error(`Provider ${providerArg.name} not found`);
    }

    const staticModels = provider.staticModels || [];

    if (!provider.getDynamicModels) {
      return staticModels;
    }

    try {
      const dynamicModels = await provider.getDynamicModels(
        options.apiKeys,
        options.providerSettings?.[provider.name],
        options.serverEnv,
      );

      return [...staticModels, ...dynamicModels];
    } catch (error) {
      logger.error(`Error getting dynamic models from ${provider.name}:`, error);
      return staticModels;
    }
  }

  getStaticModelListFromProvider(providerArg: BaseProvider) {
    const provider = this._providers.get(providerArg.name);

    if (!provider) {
      throw new Error(`Provider ${providerArg.name} not found`);
    }

    return provider.staticModels || [];
  }

  getDefaultProvider(): BaseProvider {
    // Возвращаем первого провайдера как дефолтного
    return Array.from(this._providers.values())[0];
  }
}
