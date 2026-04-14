-- Migration: enrich progress data
-- Adds streak, last_play_date, and progress_json (rich completedTasks objects with solutions)
-- Keeps completed_tasks text[] for backward compat

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_play_date date,
  ADD COLUMN IF NOT EXISTS progress_json jsonb DEFAULT '[]'::jsonb;

-- Migrate existing completed_tasks text[] → progress_json jsonb objects
UPDATE profiles
SET progress_json = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'taskId', t,
      'stars', 1,
      'foundPrinciple', '',
      'solutions', '[]'::jsonb,
      'solvedAt', now()::text
    )
  )
  FROM unnest(completed_tasks) t
)
WHERE completed_tasks IS NOT NULL
  AND array_length(completed_tasks, 1) > 0
  AND (progress_json IS NULL OR progress_json = '[]'::jsonb);
