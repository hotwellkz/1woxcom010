import { createClient } from '@supabase/supabase-js';

// Используем предоставленные значения
const supabaseUrl = 'https://bhlzwqteygmxpxznezyg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJobHp3cXRleWdteHB4em5lenlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4ODM2NTcsImV4cCI6MjA1MjQ1OTY1N30.3xAtMLN1Ke_1vrfsCU0LJHF-4G5naIc8dMSH9RG-tjs';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
