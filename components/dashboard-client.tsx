'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { Clock, AlertCircle, CalendarDays, BookOpen, ListOrdered } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { StageBadge } from '@/components/stage-badge'
import { SnoozeDialog } from '@/components/snooze-dialog'
import { Problem } from '@/lib/supabase'

interface DashboardClientProps {
  dueProblems: Problem[]
  upcomingProblems: Problem[]
  totalCount: number
  fifoCount: number
  defaultSnoozeDays: number
}

function isOverdue(dateStr: string) {
  const d = parseISO(dateStr)
  return isPast(d) && !isToday(d)
}

export function DashboardClient({
  dueProblems,
  upcomingProblems,
  totalCount,
  fifoCount,
  defaultSnoozeDays,
}: DashboardClientProps) {
  const router = useRouter()
  const [snoozingProblem, setSnoozingProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleSolve = async (problem: Problem) => {
    setLoading(`solve-${problem.id}`)
    try {
      const res = await fetch(`/api/problems/${problem.id}/solve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success(`${problem.title} marked as solved!`)
      router.refresh()
    } catch {
      toast.error('Failed to mark as solved')
    } finally {
      setLoading(null)
    }
  }

  const handleSnooze = async (problem: Problem, days: number) => {
    setLoading(`snooze-${problem.id}`)
    try {
      const res = await fetch(`/api/problems/${problem.id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Snoozed for ${days} days`)
      router.refresh()
    } catch {
      toast.error('Failed to snooze')
    } finally {
      setLoading(null)
    }
  }

  const overdueCount = dueProblems.filter(p => p.next_review_date && isOverdue(p.next_review_date)).length
  const dueTodayCount = dueProblems.length - overdueCount

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertCircle} label="Overdue" value={overdueCount} color="text-red-400" />
        <StatCard icon={Clock} label="Due Today" value={dueTodayCount} color="text-yellow-400" />
        <StatCard icon={BookOpen} label="Total Problems" value={totalCount} color="text-blue-400" />
        <StatCard icon={ListOrdered} label="In Queue" value={fifoCount} color="text-purple-400" />
      </div>

      {/* Due Problems */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          Due for Review
          {dueProblems.length > 0 && (
            <Badge variant="destructive" className="ml-1">{dueProblems.length}</Badge>
          )}
        </h2>
        {dueProblems.length === 0 ? (
          <EmptyState message="You're all caught up! No problems due." />
        ) : (
          <div className="space-y-3">
            {dueProblems.map(problem => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                overdue={!!(problem.next_review_date && isOverdue(problem.next_review_date))}
                onSolve={() => handleSolve(problem)}
                onSnooze={() => setSnoozingProblem(problem)}
                solvingLoading={loading === `solve-${problem.id}`}
                snoozeLoading={loading === `snooze-${problem.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-400" />
          Upcoming (Next 7 Days)
        </h2>
        {upcomingProblems.length === 0 ? (
          <EmptyState message="Nothing coming up in the next 7 days." />
        ) : (
          <div className="space-y-2">
            {upcomingProblems.map(problem => (
              <UpcomingCard key={problem.id} problem={problem} />
            ))}
          </div>
        )}
      </section>

      {snoozingProblem && (
        <SnoozeDialog
          open={!!snoozingProblem}
          onClose={() => setSnoozingProblem(null)}
          onSnooze={(days) => handleSnooze(snoozingProblem, days)}
          defaultDays={defaultSnoozeDays}
          problemTitle={`#${snoozingProblem.lc_number} ${snoozingProblem.title}`}
        />
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${color}`} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProblemCard({
  problem,
  overdue,
  onSolve,
  onSnooze,
  solvingLoading,
  snoozeLoading,
}: {
  problem: Problem
  overdue: boolean
  onSolve: () => void
  onSnooze: () => void
  solvingLoading: boolean
  snoozeLoading: boolean
}) {
  return (
    <Card className={overdue ? 'border-red-500/30' : 'border-yellow-500/30'}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-muted-foreground text-sm">#{problem.lc_number}</span>
              <span className="font-medium truncate">{problem.title}</span>
              <DifficultyBadge difficulty={problem.difficulty} />
              <StageBadge stage={problem.stage} />
              {overdue && problem.next_review_date && (
                <Badge variant="destructive" className="text-xs">
                  Overdue · {format(parseISO(problem.next_review_date), 'MMM d')}
                </Badge>
              )}
            </div>
            {problem.notes && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{problem.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onSnooze}
              disabled={snoozeLoading}
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              Snooze
            </Button>
            <Button size="sm" onClick={onSolve} disabled={solvingLoading}>
              {solvingLoading ? 'Saving...' : 'Solved'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingCard({ problem }: { problem: Problem }) {
  return (
    <Card className="border-border/50">
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-20 shrink-0">
            {problem.next_review_date ? format(parseISO(problem.next_review_date), 'MMM d') : '—'}
          </span>
          <span className="font-mono text-muted-foreground text-sm">#{problem.lc_number}</span>
          <span className="font-medium text-sm flex-1 truncate">{problem.title}</span>
          <DifficultyBadge difficulty={problem.difficulty} />
          <StageBadge stage={problem.stage} />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
