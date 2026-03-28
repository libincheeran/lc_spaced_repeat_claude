-- Spaced Repetition LeetCode App Schema

-- Problems table: stores each LC problem and its current review state
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lc_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  notes TEXT,
  solution TEXT,
  passed BOOLEAN DEFAULT FALSE,

  -- Review stage: 3d → 3w → 3m → fifo
  stage TEXT NOT NULL DEFAULT '3d' CHECK (stage IN ('3d', '3w', '3m', 'fifo')),

  -- Next review date (NULL for fifo items not yet picked)
  next_review_date DATE,

  -- For FIFO queue ordering: timestamp when problem entered fifo stage
  fifo_entered_at TIMESTAMPTZ,

  -- When currently snoozed until (NULL if not snoozed)
  snoozed_until DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table: single-row config
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_snooze_days INTEGER NOT NULL DEFAULT 14
);

-- Insert default settings row
INSERT INTO settings (id, default_snooze_days)
VALUES (1, 14)
ON CONFLICT (id) DO NOTHING;

-- Review history: log every review action for auditing
CREATE TABLE IF NOT EXISTS review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('solved', 'snoozed', 'picked_from_queue', 'returned_to_queue')),
  stage_before TEXT NOT NULL,
  stage_after TEXT NOT NULL,
  snoozed_days INTEGER, -- populated when action = 'snoozed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on problems
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
