'use client';

import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { EditorCanvas } from './EditorCanvas';
import { compositeImage, downloadBlob } from '@/lib/canvas';
import type { Template, PixelCrop, EditorPhase } from '@/lib/types';
import {
  UploadIcon,
  CheckIcon,
  DownloadIcon,
  RotateCcwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ImageIcon,
  FileImageIcon,
} from 'lucide-react';

const PHASES: EditorPhase[] = ['upload', 'crop', 'preview', 'done'];
const PHASE_LABELS = ['Upload', 'Adjust', 'Preview', 'Done'];

interface PhotoEditorProps {
  template: Template;
}

export function PhotoEditor({ template }: PhotoEditorProps) {
  const [phase, setPhase] = useState<EditorPhase>('upload');
  const [userFile, setUserFile] = useState<File | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);

  // react-easy-crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  // Final output
  const [isCompositing, setIsCompositing] = useState(false);
  const [finalPngBlob, setFinalPngBlob] = useState<Blob | null>(null);
  const [finalJpegBlob, setFinalJpegBlob] = useState<Blob | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const cropAspect = template.user_area_width / template.user_area_height;
  const circular = template.user_area_circular ?? false;

  // Build object URL for uploaded file
  useEffect(() => {
    if (!userFile) return;
    const url = URL.createObjectURL(userFile);
    setUserImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [userFile]);

  const handleFileAccepted = useCallback((file: File) => {
    setUserFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setFinalPngBlob(null);
    setFinalJpegBlob(null);
    setPreviewDataUrl(null);
    setPhase('crop');
  }, []);

  const handleCropComplete = useCallback((_: unknown, pixels: PixelCrop) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleProceedToPreview = async () => {
    if (!userImageUrl) return;
    setIsCompositing(true);

    try {
      const [pngBlob, jpegBlob] = await Promise.all([
        compositeImage(userImageUrl, croppedAreaPixels, template, 'png', circular),
        compositeImage(userImageUrl, croppedAreaPixels, template, 'jpeg', circular),
      ]);
      setFinalPngBlob(pngBlob);
      setFinalJpegBlob(jpegBlob);

      // Generate a data URL for the preview <img>
      const reader = new FileReader();
      reader.onload = () => setPreviewDataUrl(reader.result as string);
      reader.readAsDataURL(jpegBlob);

      setPhase('preview');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong generating the preview. Please try again.');
    } finally {
      setIsCompositing(false);
    }
  };

  const handleDownloadPng = () => {
    if (!finalPngBlob) return;
    downloadBlob(finalPngBlob, `${template.name.replace(/\s+/g, '-')}-profile.png`);
    toast.success('PNG downloaded!');
    setPhase('done');
  };

  const handleDownloadJpeg = () => {
    if (!finalJpegBlob) return;
    downloadBlob(finalJpegBlob, `${template.name.replace(/\s+/g, '-')}-profile.jpg`);
    toast.success('JPEG downloaded!');
    setPhase('done');
  };

  const handleReset = () => {
    setPhase('upload');
    setUserFile(null);
    setUserImageUrl(null);
    setFinalPngBlob(null);
    setFinalJpegBlob(null);
    setPreviewDataUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const currentStepIndex = PHASES.indexOf(phase) + 1;

  return (
    <div className="space-y-6">
      <StepIndicator steps={PHASE_LABELS} currentStep={currentStepIndex} />

      {/* UPLOAD phase */}
      {phase === 'upload' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Upload your photo and we&apos;ll fit it into the template for you. You can adjust the position and zoom
              before downloading.
            </p>
          </div>

          {/* Show overlay preview */}
          <div className="overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={template.overlay_image_url}
              alt="Template preview"
              className="w-full object-contain"
              style={{ maxHeight: 300 }}
            />
          </div>

          <ImageUploader
            onFileAccepted={handleFileAccepted}
            label="Upload Your Photo"
            hint="Your photo will be cropped to fit the template"
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] }}
          />
        </div>
      )}

      {/* CROP phase */}
      {phase === 'crop' && userImageUrl && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">Pinch to zoom · Drag to reposition your photo</p>

          {/* Cropper + live overlay preview */}
          <div
            className="relative w-full overflow-hidden rounded-xl border border-border bg-black"
            style={{ aspectRatio: `${template.canvas_width} / ${template.canvas_height}` }}
          >
            <Cropper
              image={userImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              showGrid={false}
              cropShape={circular ? 'round' : 'rect'}
              style={{
                containerStyle: { borderRadius: '0' },
                cropAreaStyle: { border: '2px dashed rgba(255,255,255,0.6)' },
              }}
            />

            {/* Live overlay preview — pointer-events:none so it doesn't block touch */}
            <div className="pointer-events-none absolute inset-0">
              <EditorCanvas
                userImageUrl={userImageUrl}
                template={template}
                croppedAreaPixels={croppedAreaPixels}
                className="h-full w-full"
              />
            </div>
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

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              <RotateCcwIcon className="mr-1.5 h-4 w-4" />
              Change Photo
            </Button>
            <Button className="flex-1" onClick={handleProceedToPreview} disabled={isCompositing}>
              {isCompositing ? (
                'Generating…'
              ) : (
                <>
                  <CheckIcon className="mr-1.5 h-4 w-4" /> Preview Result
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* PREVIEW phase */}
      {phase === 'preview' && previewDataUrl && (
        <div className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Here&apos;s your profile picture! Choose a format to download.
          </p>

          <div className="overflow-hidden rounded-xl border border-border shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewDataUrl} alt="Your profile picture" className="w-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleDownloadPng} className="flex-col h-auto py-3 gap-1">
              <ImageIcon className="h-5 w-5" />
              <span className="font-semibold">PNG</span>
              <span className="text-xs text-muted-foreground">Best quality</span>
            </Button>
            <Button onClick={handleDownloadJpeg} className="flex-col h-auto py-3 gap-1">
              <FileImageIcon className="h-5 w-5" />
              <span className="font-semibold">JPEG</span>
              <span className="text-xs opacity-80">Smaller · WhatsApp</span>
            </Button>
          </div>

          <Button variant="ghost" className="w-full" onClick={() => setPhase('crop')}>
            ← Adjust Photo
          </Button>
        </div>
      )}

      {/* DONE phase */}
      {phase === 'done' && (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckIcon className="h-10 w-10 text-green-600 dark:text-green-300" />
          </div>

          <div>
            <h3 className="text-xl font-bold">Looking great!</h3>
            <p className="mt-1 text-muted-foreground">
              Your profile picture has been downloaded. Set it as your profile photo and share the joy! 🎉
            </p>
          </div>

          {previewDataUrl && (
            <div className="mx-auto max-w-[280px] overflow-hidden rounded-xl border border-border shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewDataUrl} alt="Your profile picture" className="w-full" />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => setPhase('preview')}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download Again
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <UploadIcon className="mr-2 h-4 w-4" />
              Create Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
