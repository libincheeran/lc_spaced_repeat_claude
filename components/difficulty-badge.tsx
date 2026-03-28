import { Badge } from '@/components/ui/badge'
import { Difficulty } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty | null }) {
  if (!difficulty) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize font-medium',
        difficulty === 'easy' && 'border-green-500 text-green-500',
        difficulty === 'medium' && 'border-yellow-500 text-yellow-500',
        difficulty === 'hard' && 'border-red-500 text-red-500',
      )}
    >
      {difficulty}
    </Badge>
  )
}
