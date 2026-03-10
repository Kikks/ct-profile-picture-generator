'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { Step1Info } from './steps/Step1Info';
import { Step2Upload } from './steps/Step2Upload';
import { Step3AreaSelector } from './steps/Step3AreaSelector';
import { Step4Preview } from './steps/Step4Preview';
import { Step5Publish } from './steps/Step5Publish';
import type { UserArea } from '@/lib/types';
import type { Step1Values } from './steps/Step1Info';

const STEPS = ['Info', 'Design', 'Position', 'Preview', 'Publish'];

interface TemplateCreatorProps {
  appUrl: string;
  // When editing an existing template, pass this:
  existingTemplate?: {
    id: string;
    name: string;
    description?: string;
    overlay_image_url: string;
    canvas_width: number;
    canvas_height: number;
    user_area_x: number;
    user_area_y: number;
    user_area_width: number;
    user_area_height: number;
    user_area_circular: boolean;
    overlay_on_top: boolean;
    is_published: boolean;
  };
}

export function TemplateCreator({ appUrl, existingTemplate }: TemplateCreatorProps) {
  const isEditing = !!existingTemplate;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Wizard state
  const [info, setInfo] = useState<(Step1Values & { canvas_width: number; canvas_height: number }) | null>(
    existingTemplate
      ? {
          name: existingTemplate.name,
          description: existingTemplate.description,
          aspect_ratio: 'custom',
          canvas_width: existingTemplate.canvas_width,
          canvas_height: existingTemplate.canvas_height,
        }
      : null,
  );
  const [overlayUrl, setOverlayUrl] = useState<string | null>(existingTemplate?.overlay_image_url ?? null);
  const [userArea, setUserArea] = useState<UserArea>({
    x: existingTemplate?.user_area_x ?? 100,
    y: existingTemplate?.user_area_y ?? 100,
    width: existingTemplate?.user_area_width ?? 800,
    height: existingTemplate?.user_area_height ?? 800,
  });
  const [overlayOnTop, setOverlayOnTop] = useState(existingTemplate?.overlay_on_top ?? true);
  const [circularCrop, setCircularCrop] = useState(existingTemplate?.user_area_circular ?? false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(existingTemplate?.id ?? null);
  const [isPublished, setIsPublished] = useState(existingTemplate?.is_published ?? false);

  // When canvas dimensions change, reset user area to a sensible default
  const handleInfoNext = (values: Step1Values & { canvas_width: number; canvas_height: number }) => {
    setInfo(values);
    if (!existingTemplate) {
      const margin = Math.round(values.canvas_width * 0.1);
      setUserArea({
        x: margin,
        y: margin,
        width: values.canvas_width - margin * 2,
        height: values.canvas_height - margin * 2,
      });
    }
    setStep(2);
  };

  const handleOverlayNext = (url: string) => {
    setOverlayUrl(url);
    setStep(3);
  };

  const handleAreaNext = async () => {
    // Save the template on step 3 → 4 transition
    await saveTemplate();
    setStep(4);
  };

  const saveTemplate = async () => {
    if (!info || !overlayUrl) return;
    setSaving(true);

    const payload = {
      name: info.name,
      description: info.description ?? null,
      overlay_image_url: overlayUrl,
      canvas_width: info.canvas_width,
      canvas_height: info.canvas_height,
      user_area_x: Math.round(userArea.x),
      user_area_y: Math.round(userArea.y),
      user_area_width: Math.round(userArea.width),
      user_area_height: Math.round(userArea.height),
      user_area_circular: circularCrop,
      overlay_on_top: overlayOnTop,
      is_published: isPublished,
    };

    const url = isEditing && savedTemplateId ? `/api/templates/${savedTemplateId}` : '/api/templates';
    const method = isEditing && savedTemplateId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setSavedTemplateId(data.id);
      setIsPublished(data.is_published);
    } else {
      toast.error('Failed to save template. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="mx-auto max-w-lg">
        {step === 1 && <Step1Info defaultValues={info ?? undefined} onNext={handleInfoNext} />}

        {step === 2 && (
          <Step2Upload existingUrl={overlayUrl ?? undefined} onNext={handleOverlayNext} onBack={() => setStep(1)} />
        )}

        {step === 3 && info && overlayUrl && (
          <Step3AreaSelector
            overlayImageUrl={overlayUrl}
            canvasWidth={info.canvas_width}
            canvasHeight={info.canvas_height}
            value={userArea}
            overlayOnTop={overlayOnTop}
            circular={circularCrop}
            onChange={setUserArea}
            onOverlayOnTopChange={setOverlayOnTop}
            onCircularChange={setCircularCrop}
            onNext={handleAreaNext}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && info && overlayUrl && (
          <Step4Preview
            overlayImageUrl={overlayUrl}
            canvasWidth={info.canvas_width}
            canvasHeight={info.canvas_height}
            userArea={userArea}
            overlayOnTop={overlayOnTop}
            circular={circularCrop}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}

        {step === 5 && savedTemplateId && (
          <Step5Publish
            templateId={savedTemplateId}
            appUrl={appUrl}
            isPublished={isPublished}
            onTogglePublish={setIsPublished}
          />
        )}

        {saving && <div className="mt-4 text-center text-sm text-muted-foreground">Saving…</div>}
      </div>
    </div>
  );
}
