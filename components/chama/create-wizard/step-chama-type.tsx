'use client'

import { PiggyBank, RotateCcw, Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ChamaType } from '@/lib/types/chama'
import type { CreateChamaFormData } from '@/lib/hooks/use-create-chama-form'

interface StepChamaTypeProps {
  formData: CreateChamaFormData
  updateField: <K extends keyof CreateChamaFormData>(
    field: K,
    value: CreateChamaFormData[K]
  ) => void
}

const chamaTypes: {
  type: ChamaType
  icon: typeof PiggyBank
  title: string
  description: string
}[] = [
  {
    type: 'savings',
    icon: PiggyBank,
    title: 'Savings',
    description: 'Build savings over time. No rotating payouts.',
  },
  {
    type: 'merry_go_round',
    icon: RotateCcw,
    title: 'Merry-go-round',
    description: 'Traditional rotating savings. Pooled contributions rotate.',
  },
  {
    type: 'hybrid',
    icon: Layers,
    title: 'Hybrid',
    description: 'Combination of rotating payouts and savings.',
  },
]

export function StepChamaType({ formData, updateField }: StepChamaTypeProps) {
  const typeColors = {
    savings: {
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      light: 'from-purple-500/10 via-purple-500/5 to-transparent',
      glow: 'purple-500/20',
    },
    merry_go_round: {
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      light: 'from-blue-500/10 via-blue-500/5 to-transparent',
      glow: 'blue-500/20',
    },
    hybrid: {
      gradient: 'from-emerald-500 via-green-600 to-teal-500',
      light: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      glow: 'emerald-500/20',
    },
  }

  return (
    <div className="grid gap-2.5 md:gap-4 md:grid-cols-3">
      {chamaTypes.map((chamaType) => {
        const Icon = chamaType.icon
        const isSelected = formData.chamaType === chamaType.type
        const colors = typeColors[chamaType.type]

        return (
          <Card
            key={chamaType.type}
            className={cn(
              'group relative cursor-pointer transition-all duration-300 overflow-hidden',
              'hover:shadow-lg hover:scale-[1.01] border-2',
              isSelected 
                ? `ring-2 ring-primary shadow-lg scale-[1.01] border-primary/50 bg-gradient-to-br ${colors.light}` 
                : 'hover:border-primary/30 border-border/50'
            )}
            onClick={() => updateField('chamaType', chamaType.type)}
          >
            {/* Multi-layer gradient background */}
            {isSelected && (
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${colors.gradient} opacity-5 blur-xl`} />
            )}
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            
            <CardHeader className="relative z-10 pb-2 p-4">
              <div className="flex items-center gap-3 mb-2">
                {/* Icon container */}
                <div
                  className={cn(
                    'relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg transition-all duration-300 shadow-md flex-shrink-0',
                    isSelected 
                      ? `bg-gradient-to-br ${colors.gradient} text-white shadow-lg` 
                      : 'bg-muted group-hover:bg-muted/80'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 md:h-6 md:w-6 transition-transform duration-300',
                    isSelected && 'scale-110'
                  )} />
                  {/* Inner shine */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 to-transparent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm md:text-base font-bold mb-0.5">{chamaType.title}</CardTitle>
                  <CardDescription className="text-[10px] md:text-xs leading-tight text-muted-foreground line-clamp-2">
                    {chamaType.description}
                  </CardDescription>
                </div>
              </div>
              {/* Selection indicator */}
              {isSelected && (
                <div className="flex items-center gap-1.5 text-primary text-[10px] font-semibold mt-1">
                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                  <span>Selected</span>
                </div>
              )}
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}

