-- ============================================================
-- Город ТРИЗ — Supabase Tables Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. TSAR WORDS (слова для Царь-горы) ──────────────────────

CREATE TABLE IF NOT EXISTS tsar_words (
  id serial PRIMARY KEY,
  word text NOT NULL,
  category text NOT NULL DEFAULT 'object',
  difficulty int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tsar_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tsar_words" ON tsar_words
  FOR SELECT USING (true);

CREATE POLICY "Admin write tsar_words" ON tsar_words
  FOR ALL USING (true);

-- Seed data: 25 words difficulty 1-3
INSERT INTO tsar_words (word, category, difficulty) VALUES
  ('Яблоко',           'object',    1),
  ('Кошка',            'animal',    1),
  ('Стул',             'object',    1),
  ('Дождь',            'nature',    1),
  ('Солнце',           'nature',    1),
  ('Книга',            'object',    1),
  ('Дерево',           'nature',    1),
  ('Снег',             'nature',    1),
  ('Мяч',              'object',    1),
  ('Самолёт',          'object',    2),
  ('Компас',           'object',    2),
  ('Телескоп',         'object',    2),
  ('Маяк',             'object',    2),
  ('Вулкан',           'nature',    2),
  ('Зеркало',          'object',    2),
  ('Магнит',           'object',    2),
  ('Парашют',          'object',    2),
  ('Термос',           'object',    2),
  ('Бумеранг',         'object',    3),
  ('Перископ',         'object',    3),
  ('Сонар',            'object',    3),
  ('Архимедов винт',   'object',    3),
  ('Калейдоскоп',      'object',    3),
  ('Лупа',             'object',    2),
  ('Голография',       'phenomenon', 3)
ON CONFLICT DO NOTHING;


-- ── 2. BREDO ITEMS (предметы для Бредогенератора) ─────────────

CREATE TABLE IF NOT EXISTS bredo_items (
  id serial PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📦',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bredo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read bredo_items" ON bredo_items
  FOR SELECT USING (true);

CREATE POLICY "Admin write bredo_items" ON bredo_items
  FOR ALL USING (true);

-- Seed data: 20 items
INSERT INTO bredo_items (name, emoji) VALUES
  ('Ложка',            '🥄'),
  ('Карандаш',         '✏️'),
  ('Верёвка',          '🪢'),
  ('Пуговица',         '🔘'),
  ('Зеркало',          '🪞'),
  ('Магнит',           '🧲'),
  ('Воздушный шарик',  '🎈'),
  ('Скрепка',          '📎'),
  ('Стакан воды',      '🥛'),
  ('Лупа',             '🔍'),
  ('Пружина',          '🌀'),
  ('Мел',              '🪨'),
  ('Соломинка',        '🥤'),
  ('Фольга',           '✨'),
  ('Вилка',            '🍴'),
  ('Гвоздь',           '🔩'),
  ('Резинка',          '🔴'),
  ('Свечка',           '🕯️'),
  ('Ключ',             '🔑'),
  ('Линейка',          '📏')
ON CONFLICT DO NOTHING;


-- ── 3. TASKS (ТРИЗ задачи из src/tasks.js) ────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id int PRIMARY KEY,
  category text NOT NULL,
  title text NOT NULL,
  difficulty int NOT NULL DEFAULT 1,
  teaser text,
  icon text,
  resources jsonb,
  trick jsonb,
  ikr text,
  puzzle jsonb,
  idea_analysis jsonb,
  traps jsonb,
  customer jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tasks" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Admin write tasks" ON tasks
  FOR ALL USING (true);


-- ── 4. UGC TASKS (задачи, созданные детьми) ───────────────────

CREATE TABLE IF NOT EXISTS ugc_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  base_task_id int REFERENCES tasks(id),
  title text NOT NULL,
  teaser text NOT NULL,
  ikr text,
  resources jsonb,
  status text NOT NULL DEFAULT 'draft',
  share_token text UNIQUE DEFAULT gen_random_uuid()::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ugc_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Author read own ugc_tasks" ON ugc_tasks
  FOR SELECT USING (author_id = auth.uid() OR status = 'published');

CREATE POLICY "Author write own ugc_tasks" ON ugc_tasks
  FOR ALL USING (author_id = auth.uid());


-- ── 5. TSAR SESSIONS (история игр для ghost replay) ───────────

CREATE TABLE IF NOT EXISTS tsar_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  word_id int REFERENCES tsar_words(id) ON DELETE CASCADE,
  questions jsonb NOT NULL DEFAULT '[]',
  score int NOT NULL DEFAULT 0,
  questions_used int NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE tsar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read tsar_sessions" ON tsar_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth insert own tsar_sessions" ON tsar_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
