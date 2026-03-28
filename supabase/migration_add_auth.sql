-- Migration: Add multi-user auth support
-- Run this in Supabase SQL Editor AFTER the initial schema.sql

-- ============================================================
-- 1. PROBLEMS TABLE: add user_id
-- ============================================================

ALTER TABLE problems
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOTE: If you have existing dev data you want to keep, set user_id manually:
-- UPDATE problems SET user_id = '<your-user-uuid>';
-- Then apply NOT NULL below.

-- Delete any rows without a user_id (clean dev data):
DELETE FROM problems WHERE user_id IS NULL;

ALTER TABLE problems ALTER COLUMN user_id SET NOT NULL;

-- Drop the old global UNIQUE constraint on lc_number
-- (two users can both have problem #1)
ALTER TABLE problems DROP CONSTRAINT IF EXISTS problems_lc_number_key;
ALTER TABLE problems ADD CONSTRAINT problems_lc_number_user_unique UNIQUE (lc_number, user_id);

-- ============================================================
-- 2. REVIEW_HISTORY TABLE: add user_id
-- ============================================================

ALTER TABLE review_history
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DELETE FROM review_history WHERE user_id IS NULL;

ALTER TABLE review_history ALTER COLUMN user_id SET NOT NULL;

-- ============================================================
-- 3. SETTINGS TABLE: rebuild as per-user
-- ============================================================

DROP TABLE settings;

CREATE TABLE settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_snooze_days INTEGER NOT NULL DEFAULT 14
);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "problems: user owns rows" ON problems
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_history: user owns rows" ON review_history
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings: user owns rows" ON settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. AUTO-CREATE SETTINGS FOR NEW USERS (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id, default_snooze_days)
  VALUES (NEW.id, 14)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();
