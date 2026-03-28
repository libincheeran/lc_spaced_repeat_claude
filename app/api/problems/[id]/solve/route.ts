import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNextStage, getNextReviewDate, Stage } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: problem, error: fetchError } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

  const currentStage = problem.stage as Stage
  const nextStage = getNextStage(currentStage)

  const updatePayload: Record<string, unknown> = {
    stage: nextStage,
    snoozed_until: null,
    passed: true,
  }

  if (nextStage === 'fifo') {
    updatePayload.next_review_date = null
    updatePayload.fifo_entered_at = new Date().toISOString()
  } else {
    updatePayload.next_review_date = getNextReviewDate(new Date().toISOString(), nextStage)
  }

  const { data: updated, error: updateError } = await supabase
    .from('problems')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('review_history').insert({
    problem_id: id,
    action: 'solved',
    stage_before: currentStage,
    stage_after: nextStage,
    user_id: user.id,
  })

  return NextResponse.json(updated)
}
