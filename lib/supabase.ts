// Shared types and utilities — import clients from lib/supabase/server or lib/supabase/client

export type Difficulty = 'easy' | 'medium' | 'hard'
export type Stage = '3d' | '3w' | '3m' | 'fifo'
export type ReviewAction = 'solved' | 'snoozed' | 'picked_from_queue' | 'returned_to_queue'

export interface Problem {
  id: string
  lc_number: number
  title: string
  description: string | null
  difficulty: Difficulty | null
  notes: string | null
  solution: string | null
  passed: boolean
  stage: Stage
  next_review_date: string | null
  fifo_entered_at: string | null
  snoozed_until: string | null
  stage1_days: number | null
  stage2_days: number | null
  stage3_days: number | null
  created_at: string
  updated_at: string
}

export interface Settings {
  user_id: string
  default_snooze_days: number
  stage1_days: number
  stage2_days: number
  stage3_days: number
}

export interface ReviewHistory {
  id: string
  problem_id: string
  action: ReviewAction
  stage_before: Stage
  stage_after: Stage
  snoozed_days: number | null
  created_at: string
}

// Get the number of days for a given stage, using problem override → global settings → hardcoded default
export function getStageDays(
  stage: Stage,
  problem: Pick<Problem, 'stage1_days' | 'stage2_days' | 'stage3_days'>,
  settings: Pick<Settings, 'stage1_days' | 'stage2_days' | 'stage3_days'>
): number {
  switch (stage) {
    case '3d': return problem.stage1_days ?? settings.stage1_days ?? 3
    case '3w': return problem.stage2_days ?? settings.stage2_days ?? 21
    case '3m': return problem.stage3_days ?? settings.stage3_days ?? 90
    case 'fifo': return 0
  }
}

export function getNextReviewDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function getNextStage(current: Stage): Stage {
  const stages: Stage[] = ['3d', '3w', '3m', 'fifo']
  const idx = stages.indexOf(current)
  return stages[Math.min(idx + 1, stages.length - 1)]
}

export function stageName(stage: Stage): string {
  switch (stage) {
    case '3d': return '3 Days'
    case '3w': return '3 Weeks'
    case '3m': return '3 Months'
    case 'fifo': return 'Queue'
  }
}
