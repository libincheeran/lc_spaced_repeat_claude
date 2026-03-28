'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SnoozeDialogProps {
  open: boolean
  onClose: () => void
  onSnooze: (days: number) => void
  defaultDays: number
  problemTitle: string
}

const PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
]

export function SnoozeDialog({ open, onClose, onSnooze, defaultDays, problemTitle }: SnoozeDialogProps) {
  const [customDays, setCustomDays] = useState<string>(String(defaultDays))

  const handleSnooze = (days: number) => {
    onSnooze(days)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Snooze Problem</DialogTitle>
          <p className="text-sm text-muted-foreground">{problemTitle}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(({ label, days }) => (
              <Button
                key={days}
                variant="outline"
                size="sm"
                onClick={() => handleSnooze(days)}
                className={days === defaultDays ? 'border-primary' : ''}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="custom-days">Custom days</Label>
              <Input
                id="custom-days"
                type="number"
                min={1}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                const days = parseInt(customDays)
                if (days > 0) handleSnooze(days)
              }}
            >
              Snooze
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
