import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProblemDetailClient } from '@/components/problem-detail-client'

export const dynamic = 'force-dynamic'

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: problem }, { data: history }, { data: settings }] = await Promise.all([
    supabase.from('problems').select('*').eq('id', id).single(),
    supabase
      .from('review_history')
      .select('*')
      .eq('problem_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('settings').select('default_snooze_days').eq('user_id', user!.id).single(),
  ])

  if (!problem) notFound()

  return (
    <ProblemDetailClient
      problem={problem}
      history={history ?? []}
      defaultSnoozeDays={settings?.default_snooze_days ?? 14}
    />
  )
}
