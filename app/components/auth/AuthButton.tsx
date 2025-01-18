import { useState } from 'react';
import { supabase } from '~/lib/supabase/config';
import { AuthModal } from './AuthModal';
import { useSupabase } from '~/lib/hooks/useSupabase';

export function AuthButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useSupabase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm text-bolt-elements-textSecondary truncate max-w-[200px]">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="rounded-full p-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            title="Sign Out"
          >
            <div className="i-ph:sign-out text-xl" />
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full p-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          title="Sign In"
        >
          <div className="i-ph:sign-in text-xl" />
        </button>
      )}
      
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
