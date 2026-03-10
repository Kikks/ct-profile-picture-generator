'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 1-indexed
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <Fragment key={label}>
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <CheckIcon className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    'mt-1 hidden text-xs font-medium sm:block',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-primary',
                    !isCompleted && !isCurrent && 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {index < steps.length - 1 && (
                <div className={cn('mx-2 h-0.5 flex-1 transition-all', isCompleted ? 'bg-primary' : 'bg-border')} />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Mobile: show current step label */}
      <p className="mt-2 text-center text-sm font-medium text-primary sm:hidden">
        Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
      </p>
    </div>
  );
}
