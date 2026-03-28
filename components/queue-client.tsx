'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ListOrdered, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { Problem } from '@/lib/supabase'

export function QueueClient({ problems }: { problems: Problem[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSolve = async (problem: Problem) => {
    setLoading(problem.id)
    try {
      const res = await fetch(`/api/queue/${problem.id}/solve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success(`${problem.title} solved! Moved to end of queue.`)
      router.refresh()
    } catch {
      toast.error('Failed to mark as solved')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListOrdered className="h-6 w-6" />
          Review Queue
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Problems that have completed all scheduled stages. Pick one to review — solved problems go back to the end of the line.
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-2">
          <p className="text-muted-foreground text-sm">Queue is empty.</p>
          <p className="text-muted-foreground text-xs">Problems land here after completing the 3-month review stage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem, idx) => (
            <Card key={problem.id} className="group">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-sm w-6 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-mono text-muted-foreground text-sm w-12 shrink-0">
                    #{problem.lc_number}
                  </span>
                  <Link href={`/problems/${problem.id}`} className="flex-1 min-w-0">
                    <span className="font-medium hover:text-primary transition-colors truncate block">
                      {problem.title}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    {problem.fifo_entered_at && (
                      <span className="text-xs text-muted-foreground hidden md:block">
                        Queued {format(parseISO(problem.fifo_entered_at), 'MMM d, yyyy')}
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleSolve(problem)}
                      disabled={loading === problem.id}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      {loading === problem.id ? 'Saving...' : 'Solved'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {problems.length} problem{problems.length !== 1 ? 's' : ''} in queue
      </p>
    </div>
  )
}
