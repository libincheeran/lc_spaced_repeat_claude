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

  if (!settings) {
    const { data: created } = await supabase
      .from('settings')
      .insert({ user_id: user!.id, default_snooze_days: 14, stage1_days: 3, stage2_days: 21, stage3_days: 90 })
      .select()
      .single()
    settings = created
  }

  return (
    <SettingsClient
      defaultSnoozeDays={settings?.default_snooze_days ?? 14}
      stage1Days={settings?.stage1_days ?? 3}
      stage2Days={settings?.stage2_days ?? 21}
      stage3Days={settings?.stage3_days ?? 90}
    />
  )
}
