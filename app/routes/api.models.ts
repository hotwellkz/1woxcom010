import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ModelsAPI');

export const loader: LoaderFunction = async ({ request }) => {
  try {
    logger.info('Environment variables:', process.env);
    
    const llmManager = LLMManager.getInstance(process.env);
    const providers = llmManager.getAllProviders();
    
    logger.info('Available providers:', providers.map(p => p.name));

    // Получаем API ключи из env
    const apiKeys: Record<string, string> = {};
    providers.forEach(provider => {
      const apiTokenKey = provider.config.apiTokenKey;
      if (apiTokenKey && process.env[apiTokenKey]) {
        apiKeys[provider.name] = process.env[apiTokenKey];
        logger.info(`Found API key for provider: ${provider.name}`);
      } else {
        logger.warn(`No API key found for provider: ${provider.name}, key: ${apiTokenKey}`);
      }
    });

    logger.info('API Keys found:', Object.keys(apiKeys));

    // Получаем модели с учетом API ключей
    const models = await llmManager.updateModelList({ 
      apiKeys,
      serverEnv: process.env
    });

    logger.info(`Loaded ${models.length} models from ${providers.length} providers`);
    
    return json({ 
      models,
      providers: providers.map(p => ({
        name: p.name,
        hasApiKey: !!apiKeys[p.name],
        staticModels: p.staticModels?.length || 0
      }))
    });
  } catch (error) {
    logger.error('Error fetching models:', error);
    return json({ 
      models: [],
      providers: []
    }, { status: 500 });
  }
};
