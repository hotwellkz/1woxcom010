import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { AuthButton } from '../auth/AuthButton';
import { themeStore } from '~/lib/stores/theme';

export function Header() {
  const chat = useStore(chatStore);
  const theme = useStore(themeStore);

  return (
    <header
      className={classNames('flex items-center p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <img 
            src={theme === 'dark' ? '/logo-dark-styled.png' : '/logo-light-styled.png'} 
            alt="logo" 
            className="w-[90px]" 
          />
        </a>
      </div>
      
      {/* Center content */}
      <div className="flex-1 flex justify-center px-4">
        {chat.started && (
          <span className="truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
        )}
      </div>

      {/* Right content */}
      <div className="flex items-center gap-4">
        {chat.started && (
          <ClientOnly>
            {() => (
              <div>
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        )}
        <ClientOnly>
          {() => <AuthButton />}
        </ClientOnly>
      </div>
    </header>
  );
}
