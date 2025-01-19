import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { modelStore } from '~/lib/stores/model';
import { providersStore } from '~/lib/stores/settings';
import { ModelSelector } from '~/components/chat/ModelSelector';
import type { ProviderInfo } from '~/types/model';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

export default function Index() {
  const { availableModels, selectedModel, providers } = useStore(modelStore);
  const providerSettings = useStore(providersStore);
  const [currentModel, setCurrentModel] = useState<string | undefined>(selectedModel || undefined);
  const [currentProvider, setCurrentProvider] = useState<ProviderInfo>();
  const [isLoading, setIsLoading] = useState(true);

  // Конвертируем настройки провайдеров в список
  const providerList = Object.entries(providerSettings).map(([name, config]) => ({
    name,
    ...config,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl">
        {isLoading ? (
          <div className="text-center">
            <p>Loading models and providers...</p>
          </div>
        ) : (
          <>
            <ModelSelector
              model={currentModel}
              setModel={setCurrentModel}
              provider={currentProvider}
              setProvider={setCurrentProvider}
              modelList={availableModels}
              providerList={providerList}
              apiKeys={{}}
              modelLoading={isLoading ? 'all' : undefined}
            />
            <div className="mt-4">
              {currentModel ? (
                <p>Selected model: {currentModel}</p>
              ) : (
                <p>Please select a model to continue</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
