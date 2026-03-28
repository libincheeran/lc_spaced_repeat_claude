import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  // Auto-create for new users
  if (!settings) {
    const { data: created } = await supabase
      .from('settings')
      .insert({ user_id: user!.id, default_snooze_days: 14 })
      .select()
      .single()
    settings = created
  }

  return <SettingsClient defaultSnoozeDays={settings?.default_snooze_days ?? 14} />
}
