'use client';

import { useRef, useEffect, useCallback } from 'react';
import { drawPreview, loadImage } from '@/lib/canvas';
import type { PixelCrop, Template } from '@/lib/types';

interface EditorCanvasProps {
  userImageUrl: string;
  template: Template;
  croppedAreaPixels: PixelCrop;
  className?: string;
}

export function EditorCanvas({ userImageUrl, template, croppedAreaPixels, className }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userImgRef = useRef<HTMLImageElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Preload both images once
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage(userImageUrl), loadImage(template.overlay_image_url)])
      .then(([userImg, overlayImg]) => {
        if (cancelled) return;
        userImgRef.current = userImg;
        overlayImgRef.current = overlayImg;
        render(croppedAreaPixels);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userImageUrl, template.overlay_image_url]);

  const render = useCallback(
    (crop: PixelCrop) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!canvasRef.current || !userImgRef.current || !overlayImgRef.current) return;
        drawPreview(canvasRef.current, userImgRef.current, overlayImgRef.current, crop, template, template.user_area_circular ?? false);
      });
    },
    [template],
  );

  // Re-render whenever the crop changes
  useEffect(() => {
    if (userImgRef.current && overlayImgRef.current) {
      render(croppedAreaPixels);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [croppedAreaPixels, render]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ aspectRatio: `${template.canvas_width} / ${template.canvas_height}` }}
    />
  );
}
