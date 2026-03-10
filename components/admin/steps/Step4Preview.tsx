'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { drawPreview, loadImage } from '@/lib/canvas';
import type { UserArea, PixelCrop } from '@/lib/types';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { ZoomInIcon, ZoomOutIcon } from 'lucide-react';

interface Step4PreviewProps {
  overlayImageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  userArea: UserArea;
  overlayOnTop: boolean;
  circular?: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Preview({
  overlayImageUrl,
  canvasWidth,
  canvasHeight,
  userArea,
  overlayOnTop,
  circular = false,
  onNext,
  onBack,
}: Step4PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);

  // Crop state for the sample photo
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  const cropAspect = userArea.width / userArea.height;

  const mockTemplate = {
    canvas_width: canvasWidth,
    canvas_height: canvasHeight,
    user_area_x: userArea.x,
    user_area_y: userArea.y,
    user_area_width: userArea.width,
    user_area_height: userArea.height,
    overlay_on_top: overlayOnTop,
    overlay_image_url: overlayImageUrl,
    user_area_circular: circular,
  };

  const handleCropComplete = useCallback((_: unknown, pixels: PixelCrop) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Render the composite whenever the crop changes
  useEffect(() => {
    if (!sampleUrl || !croppedAreaPixels || !canvasRef.current) return;

    let cancelled = false;
    const render = async () => {
      const [userImg, overlayImg] = await Promise.all([loadImage(sampleUrl), loadImage(overlayImageUrl)]);
      if (cancelled) return;
      drawPreview(
        canvasRef.current!,
        userImg,
        overlayImg,
        croppedAreaPixels,
        mockTemplate as Parameters<typeof drawPreview>[4],
        circular,
      );
    };
    render().catch(console.error);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleUrl, overlayImageUrl, circular, croppedAreaPixels, JSON.stringify(mockTemplate)]);

  useEffect(() => {
    if (!sampleFile) return;
    const url = URL.createObjectURL(sampleFile);
    setSampleUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    return () => URL.revokeObjectURL(url);
  }, [sampleFile]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload a sample photo to preview how the final profile picture will look. Drag and zoom to adjust placement.
      </p>

      {sampleUrl ? (
        <>
          {/* Crop controls */}
          <div
            className="relative w-full overflow-hidden rounded-xl border border-border bg-black"
            style={{ aspectRatio: `${userArea.width} / ${userArea.height}` }}
          >
            <Cropper
              image={sampleUrl}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              cropShape={circular ? 'round' : 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              showGrid={false}
              style={{
                containerStyle: { borderRadius: '0.75rem' },
                cropAreaStyle: { border: '2px dashed rgba(255,255,255,0.5)' },
              }}
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <ZoomOutIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(v) => setZoom(Array.isArray(v) ? v[0] : v)}
              className="flex-1"
            />
            <ZoomInIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          {/* Live composite preview */}
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <canvas ref={canvasRef} className="w-full" style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }} />
          </div>
        </>
      ) : (
        <div
          className="flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
          style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
        >
          <div className="text-center">
            <p className="text-muted-foreground">Preview appears here</p>
            <p className="mt-1 text-xs text-muted-foreground">Upload a sample photo below</p>
          </div>
        </div>
      )}

      <ImageUploader
        onFileAccepted={setSampleFile}
        label={sampleFile ? 'Replace sample photo' : 'Upload Sample Photo'}
        hint="This is just for your preview — it won't be saved"
        accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Looks Good → Save & Publish
        </Button>
      </div>
    </div>
  );
}
