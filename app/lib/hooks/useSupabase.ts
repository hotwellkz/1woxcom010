import { useEffect, useState } from 'react';
import { supabase } from '../supabase/config';
import type { Database } from '../supabase/types';
import type { Message } from 'ai';

export function useSupabase() {
  const [user, setUser] = useState(supabase.auth.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveConversation = async (title: string, messages: Message[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        messages,
      });

    if (error) throw error;
  };

  const getConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const updateUserSettings = async (settings: Database['public']['Tables']['users']['Update']['settings']) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('users')
      .update({ settings })
      .eq('id', user.id);

    if (error) throw error;
  };

  const getUserSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('settings')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data?.settings;
  };

  return {
    user,
    loading,
    saveConversation,
    getConversations,
    updateUserSettings,
    getUserSettings,
  };
}
