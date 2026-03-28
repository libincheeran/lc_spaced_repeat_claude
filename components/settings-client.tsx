'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface SettingsClientProps {
  defaultSnoozeDays: number
  stage1Days: number
  stage2Days: number
  stage3Days: number
}

export function SettingsClient({ defaultSnoozeDays, stage1Days, stage2Days, stage3Days }: SettingsClientProps) {
  const [snoozeDays, setSnoozeDays] = useState(String(defaultSnoozeDays))
  const [s1, setS1] = useState(String(stage1Days))
  const [s2, setS2] = useState(String(stage2Days))
  const [s3, setS3] = useState(String(stage3Days))
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const snooze = parseInt(snoozeDays)
    const stage1 = parseInt(s1)
    const stage2 = parseInt(s2)
    const stage3 = parseInt(s3)

    if (!snooze || snooze <= 0 || !stage1 || stage1 <= 0 || !stage2 || stage2 <= 0 || !stage3 || stage3 <= 0) {
      toast.error('All values must be positive numbers')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_snooze_days: snooze,
          stage1_days: stage1,
          stage2_days: stage2,
          stage3_days: stage3,
        }),
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
            Global defaults for all problems. You can override these per problem on the problem detail page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stage1">Stage 1 (days)</Label>
              <Input
                id="stage1"
                type="number"
                min={1}
                value={s1}
                onChange={e => setS1(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">First review</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage2">Stage 2 (days)</Label>
              <Input
                id="stage2"
                type="number"
                min={1}
                value={s2}
                onChange={e => setS2(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Second review</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage3">Stage 3 (days)</Label>
              <Input
                id="stage3"
                type="number"
                min={1}
                value={s3}
                onChange={e => setS3(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Third review</p>
            </div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>After stage 3</span>
            <span>Enters FIFO queue</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Snooze Duration</CardTitle>
          <CardDescription>
            When you snooze a problem without specifying a duration, this value is used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
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
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  )
}
