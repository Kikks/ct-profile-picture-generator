'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { clamp, toDisplayCoords, toNativeCoords } from '@/lib/utils';
import type { UserArea, HandlePosition } from '@/lib/types';

interface AreaSelectorProps {
  overlayImageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  value: UserArea;
  onChange: (area: UserArea) => void;
  circular?: boolean;
  className?: string;
}

const MIN_SIZE = 20; // minimum user area in native px
const HIT_RADIUS = 14; // pointer hit radius for handles in display px
const HANDLE_SIZE = 14; // visual handle size in display px

interface HandleDef {
  pos: HandlePosition;
  displayX: number;
  displayY: number;
}

function getCursor(pos: HandlePosition): string {
  const cursors: Record<HandlePosition, string> = {
    nw: 'nw-resize',
    n: 'n-resize',
    ne: 'ne-resize',
    e: 'e-resize',
    se: 'se-resize',
    s: 's-resize',
    sw: 'sw-resize',
    w: 'w-resize',
    move: 'move',
  };
  return cursors[pos];
}

export function AreaSelector({
  overlayImageUrl,
  canvasWidth,
  canvasHeight,
  value,
  onChange,
  circular = false,
  className,
}: AreaSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  // Drag state stored in refs to avoid stale closure issues
  const dragging = useRef<{
    handle: HandlePosition;
    startX: number;
    startY: number;
    startArea: UserArea;
  } | null>(null);

  // Measure container on mount and resize
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDisplaySize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Convert native area → display rect
  const displayArea = {
    x: toDisplayCoords(value.x, canvasWidth, displaySize.w),
    y: toDisplayCoords(value.y, canvasHeight, displaySize.h),
    width: toDisplayCoords(value.width, canvasWidth, displaySize.w),
    height: toDisplayCoords(value.height, canvasHeight, displaySize.h),
  };

  const getHandles = (): HandleDef[] => {
    const { x, y, width: w, height: h } = displayArea;
    return [
      { pos: 'nw', displayX: x, displayY: y },
      { pos: 'n', displayX: x + w / 2, displayY: y },
      { pos: 'ne', displayX: x + w, displayY: y },
      { pos: 'e', displayX: x + w, displayY: y + h / 2 },
      { pos: 'se', displayX: x + w, displayY: y + h },
      { pos: 's', displayX: x + w / 2, displayY: y + h },
      { pos: 'sw', displayX: x, displayY: y + h },
      { pos: 'w', displayX: x, displayY: y + h / 2 },
    ];
  };

  const hitTest = (clientX: number, clientY: number): HandlePosition | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    // Test handles first
    for (const h of getHandles()) {
      const dist = Math.hypot(mx - h.displayX, my - h.displayY);
      if (dist <= HIT_RADIUS) return h.pos;
    }

    // Test body (move)
    const { x, y, width: w, height: h } = displayArea;
    if (mx >= x && mx <= x + w && my >= y && my <= y + h) return 'move';

    return null;
  };

  const applyDelta = useCallback(
    (handle: HandlePosition, dx: number, dy: number, startArea: UserArea): UserArea => {
      // Convert display delta → native delta
      const ndx = toNativeCoords(dx, displaySize.w, canvasWidth);
      const ndy = toNativeCoords(dy, displaySize.h, canvasHeight);

      let { x, y, width: w, height: h } = startArea;

      if (handle === 'move') {
        x = clamp(x + ndx, 0, canvasWidth - w);
        y = clamp(y + ndy, 0, canvasHeight - h);
        return { x, y, width: w, height: h };
      }

      // Apply per-handle edge adjustment
      if (handle.includes('w')) {
        x += ndx;
        w -= ndx;
      }
      if (handle.includes('n')) {
        y += ndy;
        h -= ndy;
      }
      if (handle.includes('e')) {
        w += ndx;
      }
      if (handle.includes('s')) {
        h += ndy;
      }

      // Enforce minimum size and canvas bounds
      w = Math.max(MIN_SIZE, w);
      h = Math.max(MIN_SIZE, h);
      x = clamp(x, 0, canvasWidth - MIN_SIZE);
      y = clamp(y, 0, canvasHeight - MIN_SIZE);
      if (x + w > canvasWidth) w = canvasWidth - x;
      if (y + h > canvasHeight) h = canvasHeight - y;

      return { x, y, width: w, height: h };
    },
    [displaySize.w, displaySize.h, canvasWidth, canvasHeight],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const handle = hitTest(e.clientX, e.clientY);
      if (!handle) return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      dragging.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startArea: { ...value },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, displayArea, displaySize],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();

      const dx = e.clientX - dragging.current.startX;
      const dy = e.clientY - dragging.current.startY;
      const newArea = applyDelta(dragging.current.handle, dx, dy, dragging.current.startArea);
      onChange(newArea);
    },
    [applyDelta, onChange],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const [hoveredHandle, setHoveredHandle] = useState<HandlePosition | null>(null);

  const onPointerMoveForCursor = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) {
        onPointerMove(e);
        return;
      }
      const hit = hitTest(e.clientX, e.clientY);
      setHoveredHandle(hit);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onPointerMove, displayArea, displaySize],
  );

  const handles = imgLoaded ? getHandles() : [];

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
        style={{
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          cursor: hoveredHandle ? getCursor(hoveredHandle) : 'default',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMoveForCursor}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Overlay image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={overlayImageUrl}
          alt="Overlay template"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          onLoad={() => setImgLoaded(true)}
          draggable={false}
        />

        {imgLoaded && (
          <>
            {/* Dark overlay outside selected area (box-shadow mask) */}
            <div
              className="pointer-events-none absolute"
              style={{
                left: displayArea.x,
                top: displayArea.y,
                width: displayArea.width,
                height: displayArea.height,
                borderRadius: circular ? '50%' : 0,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
              }}
            />

            {/* Selection border */}
            <div
              className="pointer-events-none absolute border-2 border-white"
              style={{
                left: displayArea.x,
                top: displayArea.y,
                width: displayArea.width,
                height: displayArea.height,
                borderRadius: circular ? '50%' : 0,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
              }}
            >
              {/* Crosshair lines */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-40" style={{ borderRadius: circular ? '50%' : 0 }}>
                <div className="absolute inset-x-0 top-1/2 h-px bg-white" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-white" />
              </div>
              {/* Label */}
              <div className="absolute -top-6 left-0 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                User photo area
              </div>
            </div>

            {/* Resize handles */}
            {handles.map((h) => (
              <div
                key={h.pos}
                className="pointer-events-none absolute rounded-full border-2 border-primary bg-white shadow-md"
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  left: h.displayX - HANDLE_SIZE / 2,
                  top: h.displayY - HANDLE_SIZE / 2,
                }}
              />
            ))}
          </>
        )}

        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Drag the box to reposition · Drag corner/edge handles to resize
      </p>
    </div>
  );
}
