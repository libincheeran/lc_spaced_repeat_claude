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

  // Auto-create settings row for new users
  if (!data) {
    const { data: created } = await supabase
      .from('settings')
      .insert({ user_id: user.id, default_snooze_days: 14 })
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
  const { default_snooze_days } = body

  if (!default_snooze_days || default_snooze_days <= 0) {
    return NextResponse.json({ error: 'default_snooze_days must be a positive number' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('settings')
    .upsert({ user_id: user.id, default_snooze_days })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
