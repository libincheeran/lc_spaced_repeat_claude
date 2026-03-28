import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStageDays, getNextReviewDate, Stage } from '@/lib/supabase'

// PATCH /api/problems/[id]/intervals
// Updates per-problem stage intervals and immediately reschedules the current stage
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { stage1_days, stage2_days, stage3_days } = body

  const [{ data: problem, error: fetchError }, { data: settings }] = await Promise.all([
    supabase.from('problems').select('*').eq('id', id).single(),
    supabase.from('settings').select('stage1_days, stage2_days, stage3_days').eq('user_id', user.id).single(),
  ])

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

  const updatedProblem = {
    ...problem,
    stage1_days: stage1_days ?? null,
    stage2_days: stage2_days ?? null,
    stage3_days: stage3_days ?? null,
  }

  const updatePayload: Record<string, unknown> = {
    stage1_days: stage1_days ?? null,
    stage2_days: stage2_days ?? null,
    stage3_days: stage3_days ?? null,
  }

  // Immediately reschedule if not in fifo
  if (problem.stage !== 'fifo') {
    const effectiveSettings = settings ?? { stage1_days: 3, stage2_days: 21, stage3_days: 90 }
    const days = getStageDays(problem.stage as Stage, updatedProblem, effectiveSettings)
    updatePayload.next_review_date = getNextReviewDate(days)
  }

  const { data: updated, error: updateError } = await supabase
    .from('problems')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(updated)
}
