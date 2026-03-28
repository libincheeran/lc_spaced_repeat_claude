import { createClient } from '@/lib/supabase/server'
import { ProblemsClient } from '@/components/problems-client'

export const dynamic = 'force-dynamic'

export default async function ProblemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: problems }, { data: settings }] = await Promise.all([
    supabase.from('problems').select('*').order('lc_number', { ascending: true }),
    supabase.from('settings').select('default_snooze_days').eq('user_id', user!.id).single(),
  ])

  return (
    <ProblemsClient
      problems={problems ?? []}
      defaultSnoozeDays={settings?.default_snooze_days ?? 14}
    />
  )
}
