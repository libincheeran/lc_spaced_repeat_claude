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
  created_at: string
  updated_at: string
}

export interface Settings {
  user_id: string
  default_snooze_days: number
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

export function getNextReviewDate(createdAt: string, stage: Stage): string {
  const date = new Date(createdAt)

  switch (stage) {
    case '3d':
      date.setDate(date.getDate() + 3)
      break
    case '3w':
      date.setDate(date.getDate() + 21)
      break
    case '3m':
      date.setMonth(date.getMonth() + 3)
      break
    case 'fifo':
      return ''
  }

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
