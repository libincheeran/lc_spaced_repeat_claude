import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let { data } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!data) {
    const { data: created } = await supabase
      .from('settings')
      .insert({ user_id: user.id, default_snooze_days: 14, stage1_days: 3, stage2_days: 21, stage3_days: 90 })
      .select()
      .single()
    data = created
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { default_snooze_days, stage1_days, stage2_days, stage3_days } = body

  const updates: Record<string, number> = {}
  if (default_snooze_days > 0) updates.default_snooze_days = default_snooze_days
  if (stage1_days > 0) updates.stage1_days = stage1_days
  if (stage2_days > 0) updates.stage2_days = stage2_days
  if (stage3_days > 0) updates.stage3_days = stage3_days

  const { data, error } = await supabase
    .from('settings')
    .upsert({ user_id: user.id, ...updates })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
