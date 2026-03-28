import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Stage } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  const { data: problem, error: fetchError } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

  let snoozeDays: number = body.days
  if (!snoozeDays || snoozeDays <= 0) {
    const { data: settings } = await supabase
      .from('settings')
      .select('default_snooze_days')
      .eq('user_id', user.id)
      .single()
    snoozeDays = settings?.default_snooze_days ?? 14
  }

  const snoozeUntil = new Date()
  snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays)
  const snoozeDate = snoozeUntil.toISOString().split('T')[0]

  const { data: updated, error: updateError } = await supabase
    .from('problems')
    .update({ snoozed_until: snoozeDate, next_review_date: snoozeDate })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('review_history').insert({
    problem_id: id,
    action: 'snoozed',
    stage_before: problem.stage as Stage,
    stage_after: problem.stage as Stage,
    snoozed_days: snoozeDays,
    user_id: user.id,
  })

  return NextResponse.json(updated)
}
