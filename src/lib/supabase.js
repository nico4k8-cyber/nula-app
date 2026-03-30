import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simplified progress sync
export const syncProgress = async (userId, data) => {
  if (!userId || supabaseUrl.includes('placeholder')) return null;
  
  const { data: result, error } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      ...data,
      updated_at: new Date().toISOString()
    })
    .select();
    
  if (error) console.error('Supabase sync error:', error);
  return result;
};

export const loadProgress = async (userId) => {
  if (!userId || supabaseUrl.includes('placeholder')) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) console.error('Supabase load error:', error);
  return data;
};
