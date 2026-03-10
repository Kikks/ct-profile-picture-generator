'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AreaSelector } from '@/components/admin/AreaSelector';
import type { UserArea } from '@/lib/types';
import { InfoIcon, Square, RectangleHorizontal, RectangleVertical, Circle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ShapePreset = 'square' | 'portrait' | 'landscape' | 'circle';

const SHAPE_PRESETS: { id: ShapePreset; label: string; icon: LucideIcon; ratio: [number, number] }[] = [
  { id: 'square', label: 'Square', icon: Square, ratio: [1, 1] },
  { id: 'portrait', label: 'Portrait', icon: RectangleVertical, ratio: [3, 4] },
  { id: 'landscape', label: 'Landscape', icon: RectangleHorizontal, ratio: [4, 3] },
  { id: 'circle', label: 'Circle', icon: Circle, ratio: [1, 1] },
];

const MIN_SIZE = 20;

interface Step3Props {
  overlayImageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  value: UserArea;
  overlayOnTop: boolean;
  circular: boolean;
  onChange: (area: UserArea) => void;
  onOverlayOnTopChange: (val: boolean) => void;
  onCircularChange: (val: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3AreaSelector({
  overlayImageUrl,
  canvasWidth,
  canvasHeight,
  value,
  overlayOnTop,
  circular,
  onChange,
  onOverlayOnTopChange,
  onCircularChange,
  onNext,
  onBack,
}: Step3Props) {
  const [activePreset, setActivePreset] = useState<ShapePreset | null>(circular ? 'circle' : null);

  const applyPreset = (preset: ShapePreset) => {
    setActivePreset(preset);
    onCircularChange(preset === 'circle');

    const { ratio } = SHAPE_PRESETS.find((p) => p.id === preset)!;
    const [rw, rh] = ratio;

    const centerX = value.x + value.width / 2;
    const centerY = value.y + value.height / 2;

    const maxW = canvasWidth * 0.8;
    const maxH = canvasHeight * 0.8;
    const scale = Math.min(maxW / rw, maxH / rh);
    let newW = Math.round(scale * rw);
    let newH = Math.round(scale * rh);

    let newX = Math.round(centerX - newW / 2);
    let newY = Math.round(centerY - newH / 2);

    newX = Math.max(0, Math.min(newX, canvasWidth - newW));
    newY = Math.max(0, Math.min(newY, canvasHeight - newH));
    newW = Math.min(newW, canvasWidth - newX);
    newH = Math.min(newH, canvasHeight - newY);

    onChange({ x: newX, y: newY, width: newW, height: newH });
  };

  const handleDimensionChange = (field: keyof UserArea, raw: string) => {
    const num = parseInt(raw, 10);
    if (isNaN(num) || num < 0) return;

    const updated = { ...value, [field]: num };
    updated.x = Math.max(0, Math.min(updated.x, canvasWidth - MIN_SIZE));
    updated.y = Math.max(0, Math.min(updated.y, canvasHeight - MIN_SIZE));
    updated.width = Math.max(MIN_SIZE, Math.min(updated.width, canvasWidth - updated.x));
    updated.height = Math.max(MIN_SIZE, Math.min(updated.height, canvasHeight - updated.y));

    onChange(updated);
  };

  return (
    <div className="w-full space-y-5">
      <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
        <div className="flex gap-2">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Drag the highlighted box to position where members&apos; photos will appear. Use shape presets or enter exact
            dimensions below.
          </p>
        </div>
      </div>

      {/* Shape presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Shape</Label>
        <div className="flex flex-wrap gap-2">
          {SHAPE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual area selector */}
      <AreaSelector
        overlayImageUrl={overlayImageUrl}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        value={value}
        onChange={onChange}
        circular={circular}
      />

      {/* Manual dimension inputs */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Dimensions (px)</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ['x', 'X'],
              ['y', 'Y'],
              ['width', 'W'],
              ['height', 'H'],
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="space-y-1">
              <Label htmlFor={`dim-${field}`} className="text-xs text-muted-foreground">
                {label}
              </Label>
              <Input
                id={`dim-${field}`}
                type="number"
                value={Math.round(value[field])}
                onChange={(e) => handleDimensionChange(field, e.target.value)}
                min={field === 'x' || field === 'y' ? 0 : MIN_SIZE}
                max={
                  field === 'x'
                    ? canvasWidth - MIN_SIZE
                    : field === 'y'
                      ? canvasHeight - MIN_SIZE
                      : field === 'width'
                        ? canvasWidth - value.x
                        : canvasHeight - value.y
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Layer order toggle */}
      <div className="flex w-full items-center justify-between rounded-xl border border-border p-4">
        <div className="flex-1 space-y-0.5">
          <Label htmlFor="overlay-on-top" className="text-sm font-medium">
            Overlay on top
          </Label>
          <p className="line-clamp-1 w-full text-xs text-muted-foreground">
            {overlayOnTop
              ? "Your design frames the member's photo (recommended for frames/borders)"
              : "Member's photo covers the overlay (use for background designs)"}
          </p>
        </div>

        <Switch size="sm" id="overlay-on-top" checked={overlayOnTop} onCheckedChange={onOverlayOnTopChange} />
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
  );
}
