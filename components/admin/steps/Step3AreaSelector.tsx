'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AreaSelector } from '@/components/admin/AreaSelector'
import type { UserArea } from '@/lib/types'
import { InfoIcon } from 'lucide-react'

interface Step3Props {
  overlayImageUrl: string
  canvasWidth: number
  canvasHeight: number
  value: UserArea
  overlayOnTop: boolean
  onChange: (area: UserArea) => void
  onOverlayOnTopChange: (val: boolean) => void
  onNext: () => void
  onBack: () => void
}

export function Step3AreaSelector({
  overlayImageUrl,
  canvasWidth,
  canvasHeight,
  value,
  overlayOnTop,
  onChange,
  onOverlayOnTopChange,
  onNext,
  onBack,
}: Step3Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
        <div className="flex gap-2">
          <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Drag the highlighted box to position where members&apos; photos will appear. Resize by dragging the corner
            or edge handles.
          </p>
        </div>
      </div>

      <AreaSelector
        overlayImageUrl={overlayImageUrl}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        value={value}
        onChange={onChange}
      />

      {/* Layer order toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="overlay-on-top" className="text-sm font-medium">
            Overlay on top
          </Label>
          <p className="text-xs text-muted-foreground">
            {overlayOnTop
              ? "Your design frames the member's photo (recommended for frames/borders)"
              : "Member's photo covers the overlay (use for background designs)"}
          </p>
        </div>
        <Switch id="overlay-on-top" checked={overlayOnTop} onCheckedChange={onOverlayOnTopChange} />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Preview
        </Button>
      </div>
    </div>
  )
}
