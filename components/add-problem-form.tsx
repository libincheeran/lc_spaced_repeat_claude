'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AddProblemForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    lc_number: '',
    title: '',
    description: '',
    difficulty: '',
    notes: '',
    solution: '',
    passed: false,
  })

  const set = (field: string, value: string | boolean | null) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.lc_number || !form.title) {
      toast.error('Problem number and title are required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lc_number: parseInt(form.lc_number),
          difficulty: form.difficulty || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to add problem')
        return
      }
      toast.success(`#${data.lc_number} ${data.title} added! First review in 3 days.`)
      router.push('/problems')
    } catch {
      toast.error('Failed to add problem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lc_number">LeetCode Number *</Label>
              <Input
                id="lc_number"
                type="number"
                min={1}
                placeholder="e.g. 1"
                value={form.lc_number}
                onChange={e => set('lc_number', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={form.difficulty} onValueChange={v => set('difficulty', v)}>
                <SelectTrigger id="difficulty">
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
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Two Sum"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Paste the problem description here..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Key insights, edge cases, approach..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="solution">Solution</Label>
            <Textarea
              id="solution"
              placeholder="Paste your solution code here..."
              value={form.solution}
              onChange={e => set('solution', e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="passed"
              type="checkbox"
              checked={form.passed}
              onChange={e => set('passed', e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="passed" className="cursor-pointer">Already solved this problem</Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Problem'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
