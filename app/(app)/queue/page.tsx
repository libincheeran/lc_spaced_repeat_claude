import { createClient } from '@/lib/supabase/server'
import { QueueClient } from '@/components/queue-client'

export const dynamic = 'force-dynamic'

export default async function QueuePage() {
  const supabase = await createClient()

  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .eq('stage', 'fifo')
    .order('fifo_entered_at', { ascending: true })

  return <QueueClient problems={problems ?? []} />
}
