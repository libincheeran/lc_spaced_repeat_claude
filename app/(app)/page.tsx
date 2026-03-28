import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const upcomingDate = sevenDaysFromNow.toISOString().split('T')[0]

  const [
    { data: dueProblems },
    { data: upcomingProblems },
    { count: totalCount },
    { count: fifoCount },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from('problems')
      .select('*')
      .neq('stage', 'fifo')
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true }),
    supabase
      .from('problems')
      .select('*')
      .neq('stage', 'fifo')
      .gt('next_review_date', today)
      .lte('next_review_date', upcomingDate)
      .order('next_review_date', { ascending: true }),
    supabase.from('problems').select('*', { count: 'exact', head: true }),
    supabase.from('problems').select('*', { count: 'exact', head: true }).eq('stage', 'fifo'),
    supabase.from('settings').select('default_snooze_days').eq('user_id', user!.id).single(),
  ])

  return (
    <DashboardClient
      dueProblems={dueProblems ?? []}
      upcomingProblems={upcomingProblems ?? []}
      totalCount={totalCount ?? 0}
      fifoCount={fifoCount ?? 0}
      defaultSnoozeDays={settings?.default_snooze_days ?? 14}
    />
  )
}
