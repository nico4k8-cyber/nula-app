import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const isPlaceholder = () => supabaseUrl.includes('placeholder');

// Simplified progress sync
export const syncProgress = async (userId, data) => {
  if (!userId || isPlaceholder()) return null;

  const payload = {
    id: userId,
    stars: data.stars ?? data.totalStars ?? 0,
    completed_tasks: (data.completedTasks || []).map(String), // normalize to strings
    unlocked_buildings: data.unlockedBuildings || [],
    updated_at: new Date().toISOString()
  };
  if (data.email) payload.email = data.email;

  const { data: result, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select();

  if (error) console.error('Supabase sync error:', error.message, error.details);
  return error ? null : result;
};

export const loadProgress = async (userId) => {
  if (!userId || isPlaceholder()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('stars, completed_tasks, unlocked_buildings')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') console.error('Supabase load error:', error);
  if (!data) return null;

  // Map snake_case → camelCase for the app
  return {
    stars: data.stars || 0,
    completedTasks: (data.completed_tasks || []).map(String), // normalize to strings
    unlockedBuildings: data.unlocked_buildings || [],
  };
};

// ---- PATENTS (Bredo) ----

export const loadPatents = async (userId) => {
  if (!userId || isPlaceholder()) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('patents, used_bredo_ids')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
};

export const savePatentToSupabase = async (userId, patent, usedBreoIds) => {
  if (!userId || isPlaceholder()) return null;
  // Load current patents first
  const { data: current } = await supabase
    .from('profiles')
    .select('patents')
    .eq('id', userId)
    .single();
  const existing = current?.patents || [];
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      patents: [...existing, patent],
      used_bredo_ids: usedBreoIds,
      updated_at: new Date().toISOString(),
    });
  if (error) console.error('savePatent error:', error);
};

// ---- TSAR MOUNTAIN (used word IDs) ----

export const loadUsedTsarIds = async (userId) => {
  if (!userId || isPlaceholder()) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('used_tsar_ids')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data?.used_tsar_ids || [];
};

export const saveUsedTsarIds = async (userId, usedIds) => {
  if (!userId || isPlaceholder()) return null;
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      used_tsar_ids: usedIds,
      updated_at: new Date().toISOString(),
    });
  if (error) console.error('saveUsedTsarIds error:', error);
};

// ── TSAR WORDS (управление из админки) ───────────────────────────────────────

export const loadTsarWords = async () => {
  if (isPlaceholder()) return null;
  const { data, error } = await supabase
    .from('tsar_words')
    .select('*')
    .eq('active', true)
    .order('difficulty', { ascending: true });
  if (error) return null;
  return data;
};

export const saveTsarWord = async (word) => {
  if (isPlaceholder()) return null;
  const { error } = await supabase.from('tsar_words').upsert(word);
  if (error) console.error('saveTsarWord error:', error);
  return !error;
};

export const deleteTsarWord = async (id) => {
  if (isPlaceholder()) return null;
  const { error } = await supabase.from('tsar_words').update({ active: false }).eq('id', id);
  if (error) console.error('deleteTsarWord error:', error);
  return !error;
};

// ── BREDO ITEMS (управление из админки) ──────────────────────────────────────

export const loadBredomakerItems = async () => {
  if (isPlaceholder()) return null;
  const { data, error } = await supabase
    .from('bredo_items')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) return null;
  return data;
};

export const saveBredomakerItem = async (item) => {
  if (isPlaceholder()) return null;
  const { error } = await supabase.from('bredo_items').upsert(item);
  if (error) console.error('saveBredomakerItem error:', error);
  return !error;
};

export const deleteBredomakerItem = async (id) => {
  if (isPlaceholder()) return null;
  const { error } = await supabase.from('bredo_items').update({ active: false }).eq('id', id);
  if (error) console.error('deleteBredomakerItem error:', error);
  return !error;
};

// ── АНАЛИТИКА ТОКЕНОВ ─────────────────────────────────────────────────────────

export const logTokenUsage = async ({ userId, action, model, promptTokens, completionTokens, totalTokens, costUsd }) => {
  if (isPlaceholder()) return null;
  const { error } = await supabase.from('token_usage').insert({
    user_id: userId || null,
    action,
    model: model || null,
    prompt_tokens: promptTokens || 0,
    completion_tokens: completionTokens || 0,
    total_tokens: totalTokens || 0,
    cost_usd: costUsd || 0,
  });
  if (error) console.error('logTokenUsage error:', error);
};

export const getTokenStats = async (days = 7) => {
  if (isPlaceholder()) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('token_usage')
    .select('total_tokens, cost_usd, action, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  if (error) return null;
  return data;
};

export const getPlayerStats = async () => {
  if (isPlaceholder()) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, completed_tasks, stars');
  if (error) return null;
  const totalPlayers = data.length;
  const totalTasksSolved = data.reduce((sum, p) => sum + (p.completed_tasks?.length || 0), 0);
  const totalStars = data.reduce((sum, p) => sum + (p.stars || 0), 0);
  return { totalPlayers, totalTasksSolved, totalStars };
};

// ── TASKS (ТРИЗ задачи из Supabase) ──────────────────────────────────────────

export const loadTasks = async (category) => {
  if (isPlaceholder()) return null;
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('active', true)
    .order('difficulty', { ascending: true });
  if (category) {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) {
    console.error('loadTasks error:', error);
    return null;
  }
  return data;
};

// ── UGC TASKS ─────────────────────────────────────────────────────────────────

export const saveUgcTask = async (userId, ugcTask) => {
  if (!userId || isPlaceholder()) {
    try {
      const existing = JSON.parse(localStorage.getItem('shariel_ugc_tasks') || '[]');
      existing.push({ ...ugcTask, id: Date.now().toString(), created_at: new Date().toISOString() });
      localStorage.setItem('shariel_ugc_tasks', JSON.stringify(existing));
    } catch {}
    return { id: Date.now().toString(), share_token: Math.random().toString(36).slice(2) };
  }
  const { data, error } = await supabase
    .from('ugc_tasks')
    .insert({ author_id: userId, ...ugcTask })
    .select('id, share_token')
    .single();
  if (error) {
    console.error('saveUgcTask error:', error);
    return null;
  }
  return data;
};

// App config (island mapping etc.)
export const loadAppConfig = async (key) => {
  if (isPlaceholder()) return null;
  const { data, error } = await supabase.from('app_config').select('value').eq('key', key).single();
  if (error) return null;
  return data?.value;
};

export const saveAppConfig = async (key, value) => {
  if (isPlaceholder()) return false;
  const { error } = await supabase.from('app_config').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return !error;
};

// ── TSAR SESSIONS (social layer, D-15/D-16) ──────────────────────────────────

export const saveTsarSession = async ({ userId, wordId, questions, score, questionsUsed }) => {
  if (isPlaceholder()) return null;
  const { data, error } = await supabase
    .from('tsar_sessions')
    .insert({
      user_id: userId || null,
      word_id: wordId,
      questions: questions,
      score: score,
      questions_used: questionsUsed,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) {
    console.error('saveTsarSession error:', error);
    return null;
  }
  return data?.id;
};

export const loadGhostSession = async (wordId, excludeUserId) => {
  if (isPlaceholder()) return null;
  let query = supabase
    .from('tsar_sessions')
    .select('id, questions, score, questions_used')
    .eq('word_id', wordId)
    .order('completed_at', { ascending: false })
    .limit(1);
  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }
  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return data[0];
};

export const getPlayerAlerts = async (totalWords) => {
  if (isPlaceholder()) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, used_tsar_ids, child_name, parent_email')
    .not('used_tsar_ids', 'is', null);
  if (error) return null;
  const threshold = Math.floor(totalWords * 0.8);
  return data.filter(p => (p.used_tsar_ids?.length || 0) >= threshold);
};
