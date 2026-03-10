'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ASPECT_RATIOS } from '@/lib/utils';
import type { AspectRatio } from '@/lib/types';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional(),
  aspect_ratio: z.enum(['1:1', '4:5', '16:9', '9:16', 'custom'] as const),
  custom_width: z.number().int().min(100).max(4096).optional(),
  custom_height: z.number().int().min(100).max(4096).optional(),
});

export type Step1Values = z.infer<typeof schema>;

interface Step1InfoProps {
  defaultValues?: Partial<Step1Values>;
  onNext: (values: Step1Values & { canvas_width: number; canvas_height: number }) => void;
}

export function Step1Info({ defaultValues, onNext }: Step1InfoProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(schema),
    defaultValues: { aspect_ratio: '1:1', ...defaultValues },
  });

  const selectedRatio = watch('aspect_ratio') as AspectRatio;

  const onSubmit = (values: Step1Values) => {
    let canvas_width: number, canvas_height: number;
    if (values.aspect_ratio === 'custom') {
      canvas_width = values.custom_width ?? 1000;
      canvas_height = values.custom_height ?? 1000;
    } else {
      const preset = ASPECT_RATIOS[values.aspect_ratio as Exclude<AspectRatio, 'custom'>];
      canvas_width = preset.width;
      canvas_height = preset.height;
    }
    onNext({ ...values, canvas_width, canvas_height });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Template Name <span className="text-destructive">*</span>
        </Label>
        <Input id="name" placeholder="e.g. Easter Sunday 2025" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Tell people what this template is for…"
          rows={3}
          {...register('description')}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>Canvas Size</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(ASPECT_RATIOS) as Array<Exclude<AspectRatio, 'custom'>>).map((ratio) => (
            <label
              key={ratio}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all',
                selectedRatio === ratio ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
              )}
            >
              <input type="radio" value={ratio} className="sr-only" {...register('aspect_ratio')} />
              <span className="text-lg font-bold">{ratio}</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                {ASPECT_RATIOS[ratio].width} × {ASPECT_RATIOS[ratio].height}
              </span>
            </label>
          ))}

          {/* Custom option */}
          <label
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all',
              selectedRatio === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
            )}
          >
            <input type="radio" value="custom" className="sr-only" {...register('aspect_ratio')} />
            <span className="text-lg font-bold">Custom</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">any size</span>
          </label>
        </div>

        {selectedRatio === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="custom_width" className="text-xs">
                Width (px)
              </Label>
              <Input
                id="custom_width"
                type="number"
                min={100}
                max={4096}
                placeholder="1000"
                {...register('custom_width', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom_height" className="text-xs">
                Height (px)
              </Label>
              <Input
                id="custom_height"
                type="number"
                min={100}
                max={4096}
                placeholder="1000"
                {...register('custom_height', { valueAsNumber: true })}
              />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}
