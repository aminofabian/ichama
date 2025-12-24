'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  steps: { number: number; label: string }[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="relative py-3 md:py-6">
      {/* Background decoration */}
      <div className="absolute inset-0 -mx-3 md:-mx-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border border-border/30" />
      
      <div className="relative flex items-center justify-between px-1 md:px-2">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isUpcoming = step.number > currentStep

          return (
            <div key={step.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center relative z-10 flex-1">
                <div className="relative mb-2 md:mb-4">
                  {/* Outer glow rings */}
                  {isCurrent && (
                    <>
                      <div className="absolute -inset-2 md:-inset-3 bg-primary/10 rounded-full blur-lg animate-pulse" />
                      <div className="absolute -inset-1 md:-inset-2 bg-primary/20 rounded-full blur-md" />
                    </>
                  )}
                  {/* Step circle */}
                  <div
                    className={cn(
                      'relative flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full border-2 transition-all duration-500 shadow-xl',
                      isCompleted &&
                        'border-primary bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-primary/30',
                      isCurrent &&
                        'border-primary bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-primary/40 scale-110 ring-2 md:ring-4 ring-primary/20',
                      isUpcoming && 'border-muted/50 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 md:h-6 md:w-6 stroke-[3]" />
                    ) : (
                      <span className="text-sm md:text-base font-bold">{step.number}</span>
                    )}
                    {/* Inner shine effect */}
                    {(isCompleted || isCurrent) && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                    )}
                  </div>
                </div>
                {/* Step label */}
                <div className="text-center">
                  <span
                    className={cn(
                      'block text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest transition-all duration-300',
                      isCurrent 
                        ? 'text-foreground scale-105' 
                        : isCompleted
                        ? 'text-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  {/* Progress indicator dot */}
                  {isCurrent && (
                    <div className="mt-1 md:mt-2 mx-auto h-0.5 md:h-1 w-6 md:w-8 rounded-full bg-gradient-to-r from-primary to-primary/50 animate-pulse" />
                  )}
                </div>
              </div>
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="relative mx-1 md:mx-2 h-0.5 md:h-1 flex-1 -mt-6 md:-mt-8">
                  <div className="absolute inset-0 bg-muted/50 rounded-full" />
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
                      isCompleted 
                        ? 'from-primary via-primary/90 to-primary/80 w-full shadow-sm shadow-primary/20' 
                        : 'from-primary/30 to-transparent w-0'
                    )}
                  />
                  {/* Animated progress shimmer */}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

