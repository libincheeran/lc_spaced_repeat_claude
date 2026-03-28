'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, CheckCircle2, Clock, Trash2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { StageBadge } from '@/components/stage-badge'
import { SnoozeDialog } from '@/components/snooze-dialog'
import { Problem, ReviewHistory, stageName } from '@/lib/supabase'

interface ProblemDetailClientProps {
  problem: Problem
  history: ReviewHistory[]
  defaultSnoozeDays: number
}

export function ProblemDetailClient({ problem, history, defaultSnoozeDays }: ProblemDetailClientProps) {
  const router = useRouter()
  const [showSnooze, setShowSnooze] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: problem.title,
    description: problem.description ?? '',
    difficulty: problem.difficulty ?? '',
    notes: problem.notes ?? '',
    solution: problem.solution ?? '',
    passed: problem.passed,
  })

  const set = (field: string, value: string | boolean | null) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSolve = async () => {
    setLoading('solve')
    try {
      const res = await fetch(`/api/problems/${problem.id}/solve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Marked as solved!')
      router.push('/')
    } catch {
      toast.error('Failed to mark as solved')
    } finally {
      setLoading(null)
    }
  }

  const handleSnooze = async (days: number) => {
    setLoading('snooze')
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
      setShowSnooze(false)
    }
  }

  const handleSave = async () => {
    setLoading('save')
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, difficulty: form.difficulty || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Problem updated')
      setEditing(false)
      router.refresh()
    } catch {
      toast.error('Failed to save')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete #${problem.lc_number} ${problem.title}? This cannot be undone.`)) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/problems/${problem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Problem deleted')
      router.push('/problems')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-muted-foreground">#{problem.lc_number}</span>
              <h1 className="text-xl font-bold">{problem.title}</h1>
              <DifficultyBadge difficulty={problem.difficulty} />
              <StageBadge stage={problem.stage} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Added {format(parseISO(problem.created_at), 'MMM d, yyyy')}
              {problem.next_review_date && problem.stage !== 'fifo' && (
                <> · Next review {format(parseISO(problem.next_review_date), 'MMM d, yyyy')}</>
              )}
              {problem.stage === 'fifo' && <> · In queue</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
          {problem.stage !== 'fifo' && (
            <Button variant="outline" size="sm" onClick={() => setShowSnooze(true)} disabled={!!loading}>
              <Clock className="h-3.5 w-3.5 mr-1" />
              Snooze
            </Button>
          )}
          {problem.stage !== 'fifo' && (
            <Button size="sm" onClick={handleSolve} disabled={loading === 'solve'}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {loading === 'solve' ? 'Saving...' : 'Mark Solved'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={loading === 'delete'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => set('title', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={v => set('difficulty', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Key insights, approach..." />
              </div>
              <div className="space-y-1.5">
                <Label>Solution</Label>
                <Textarea value={form.solution} onChange={e => set('solution', e.target.value)} rows={8} className="font-mono text-sm" placeholder="Your solution code..." />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="passed-edit"
                  type="checkbox"
                  checked={form.passed}
                  onChange={e => set('passed', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="passed-edit" className="cursor-pointer">Solved</Label>
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleSave} disabled={loading === 'save'}>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {loading === 'save' ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              {problem.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{problem.description}</p>
                </div>
              )}
              {problem.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                    <p className="text-sm whitespace-pre-wrap">{problem.notes}</p>
                  </div>
                </>
              )}
              {problem.solution && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Solution</h3>
                    <pre className="text-sm bg-muted/40 rounded-md p-4 overflow-x-auto font-mono whitespace-pre-wrap">
                      {problem.solution}
                    </pre>
                  </div>
                </>
              )}
              {!problem.description && !problem.notes && !problem.solution && (
                <p className="text-sm text-muted-foreground">No details added. Click Edit to add notes or a solution.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review history */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Review History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-32 shrink-0">
                  {format(parseISO(entry.created_at), 'MMM d, yyyy')}
                </span>
                <ActionBadge action={entry.action} />
                <span className="text-muted-foreground">
                  {stageName(entry.stage_before)} → {stageName(entry.stage_after)}
                  {entry.snoozed_days ? ` (${entry.snoozed_days}d)` : ''}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SnoozeDialog
        open={showSnooze}
        onClose={() => setShowSnooze(false)}
        onSnooze={handleSnooze}
        defaultDays={defaultSnoozeDays}
        problemTitle={`#${problem.lc_number} ${problem.title}`}
      />
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; className: string }> = {
    solved: { label: 'Solved', className: 'bg-green-500/15 text-green-400' },
    snoozed: { label: 'Snoozed', className: 'bg-yellow-500/15 text-yellow-400' },
    picked_from_queue: { label: 'Picked', className: 'bg-blue-500/15 text-blue-400' },
    returned_to_queue: { label: 'Returned', className: 'bg-gray-500/15 text-gray-400' },
  }
  const { label, className } = map[action] ?? { label: action, className: '' }
  return (
    <Badge variant="secondary" className={`${className} text-xs w-20 justify-center`}>
      {label}
    </Badge>
  )
}
