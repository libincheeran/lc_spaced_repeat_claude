import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNextReviewDate } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const difficulty = searchParams.get('difficulty')

  let query = supabase.from('problems').select('*').order('lc_number', { ascending: true })
  if (stage) query = query.eq('stage', stage)
  if (difficulty) query = query.eq('difficulty', difficulty)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lc_number, title, description, difficulty, notes, solution, passed, stage1_days, stage2_days, stage3_days } = body

  if (!lc_number || !title) {
    return NextResponse.json({ error: 'lc_number and title are required' }, { status: 400 })
  }

  // Fetch global settings to compute first review date
  const { data: settings } = await supabase
    .from('settings')
    .select('stage1_days')
    .eq('user_id', user.id)
    .single()

  const effectiveStage1Days = stage1_days ?? settings?.stage1_days ?? 3
  const next_review_date = getNextReviewDate(effectiveStage1Days)

  const { data, error } = await supabase
    .from('problems')
    .insert({
      lc_number,
      title,
      description,
      difficulty,
      notes,
      solution,
      passed: passed ?? false,
      stage: '3d',
      next_review_date,
      user_id: user.id,
      stage1_days: stage1_days ?? null,
      stage2_days: stage2_days ?? null,
      stage3_days: stage3_days ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `Problem #${lc_number} already exists` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
