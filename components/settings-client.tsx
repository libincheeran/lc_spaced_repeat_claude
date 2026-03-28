'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function SettingsClient({ defaultSnoozeDays }: { defaultSnoozeDays: number }) {
  const [snoozeDays, setSnoozeDays] = useState(String(defaultSnoozeDays))
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const days = parseInt(snoozeDays)
    if (!days || days <= 0) {
      toast.error('Snooze days must be a positive number')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_snooze_days: days }),
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your review preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Schedule</CardTitle>
          <CardDescription>
            New problems are scheduled at 3 days → 3 weeks → 3 months, then enter the queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted/40 p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stage 1</span>
              <span>Review after 3 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stage 2</span>
              <span>Review after 3 weeks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stage 3</span>
              <span>Review after 3 months</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">After stage 3</span>
              <span>Enters FIFO queue</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Snooze Duration</CardTitle>
          <CardDescription>
            When you snooze a problem without specifying a duration, this value is used.
            You can always override it per snooze.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="snooze-days">Days</Label>
              <Input
                id="snooze-days"
                type="number"
                min={1}
                value={snoozeDays}
                onChange={e => setSnoozeDays(e.target.value)}
                className="w-32"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
