import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  if (problem.stage !== 'fifo') {
    return NextResponse.json({ error: 'Problem is not in the fifo queue' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('problems')
    .update({ fifo_entered_at: new Date().toISOString(), passed: true })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('review_history').insert({
    problem_id: id,
    action: 'returned_to_queue',
    stage_before: 'fifo',
    stage_after: 'fifo',
    user_id: user.id,
  })

  return NextResponse.json(updated)
}
