import { Badge } from '@/components/ui/badge'
import { Stage, stageName } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium',
        stage === '3d' && 'bg-blue-500/15 text-blue-400',
        stage === '3w' && 'bg-purple-500/15 text-purple-400',
        stage === '3m' && 'bg-orange-500/15 text-orange-400',
        stage === 'fifo' && 'bg-gray-500/15 text-gray-400',
      )}
    >
      {stageName(stage)}
    </Badge>
  )
}
