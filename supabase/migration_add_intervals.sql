-- Migration: Add configurable review intervals

-- Global defaults in settings
ALTER TABLE settings
  ADD COLUMN stage1_days INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN stage2_days INTEGER NOT NULL DEFAULT 21,
  ADD COLUMN stage3_days INTEGER NOT NULL DEFAULT 90;

-- Per-problem overrides (NULL = use global settings)
ALTER TABLE problems
  ADD COLUMN stage1_days INTEGER,
  ADD COLUMN stage2_days INTEGER,
  ADD COLUMN stage3_days INTEGER;
