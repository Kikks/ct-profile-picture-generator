import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AspectRatio } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ASPECT_RATIOS: Record<Exclude<AspectRatio, 'custom'>, { width: number; height: number; label: string }> = {
  '1:1': { width: 1000, height: 1000, label: '1:1 — Square (Facebook, Instagram)' },
  '4:5': { width: 1000, height: 1250, label: '4:5 — Portrait (Instagram)' },
  '16:9': { width: 1600, height: 900, label: '16:9 — Landscape (YouTube, Twitter)' },
  '9:16': { width: 900, height: 1600, label: '9:16 — Story (Instagram, WhatsApp)' },
};

/** Clamp a value between min and max */
export const clamp = (val: number, min: number, max: number): number => Math.max(min, Math.min(max, val));

/** Convert native canvas coordinates to display (rendered) coordinates */
export const toDisplayCoords = (nativeVal: number, nativeDim: number, displayDim: number): number =>
  (nativeVal / nativeDim) * displayDim;

/** Convert display (rendered) coordinates to native canvas coordinates */
export const toNativeCoords = (displayVal: number, displayDim: number, nativeDim: number): number =>
  (displayVal / displayDim) * nativeDim;

/** Format a date string for display */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
