'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Trash2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { StageBadge } from '@/components/stage-badge'
import { SnoozeDialog } from '@/components/snooze-dialog'
import { Problem, Difficulty, Stage } from '@/lib/supabase'

interface ProblemsClientProps {
  problems: Problem[]
  defaultSnoozeDays: number
}

export function ProblemsClient({ problems, defaultSnoozeDays }: ProblemsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all')
  const [filterStage, setFilterStage] = useState<Stage | 'all'>('all')
  const [snoozingProblem, setSnoozingProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return problems.filter(p => {
      const matchesSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        String(p.lc_number).includes(search)
      const matchesDiff = filterDifficulty === 'all' || p.difficulty === filterDifficulty
      const matchesStage = filterStage === 'all' || p.stage === filterStage
      return matchesSearch && matchesDiff && matchesStage
    })
  }, [problems, search, filterDifficulty, filterStage])

  const handleDelete = async (problem: Problem) => {
    if (!confirm(`Delete #${problem.lc_number} ${problem.title}? This cannot be undone.`)) return
    setLoading(`delete-${problem.id}`)
    try {
      const res = await fetch(`/api/problems/${problem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Problem deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete problem')
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
      setSnoozingProblem(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Problems</h1>
        <Link href="/problems/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Problem
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterDifficulty} onValueChange={v => setFilterDifficulty(v as Difficulty | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={v => setFilterStage(v as Stage | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="3d">3 Days</SelectItem>
            <SelectItem value="3w">3 Weeks</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="fifo">Queue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} problem{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {problems.length === 0
            ? 'No problems yet. Add your first one!'
            : 'No problems match your filters.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(problem => (
            <Card key={problem.id} className="hover:border-border transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground text-sm w-12 shrink-0">#{problem.lc_number}</span>
                  <Link href={`/problems/${problem.id}`} className="flex-1 min-w-0">
                    <span className="font-medium hover:text-primary transition-colors truncate block">
                      {problem.title}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <StageBadge stage={problem.stage} />
                    {problem.next_review_date && problem.stage !== 'fifo' && (
                      <span className="text-xs text-muted-foreground hidden md:block">
                        Due {format(parseISO(problem.next_review_date), 'MMM d')}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setSnoozingProblem(problem)}
                      disabled={loading === `snooze-${problem.id}` || problem.stage === 'fifo'}
                      title="Snooze"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(problem)}
                      disabled={loading === `delete-${problem.id}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
