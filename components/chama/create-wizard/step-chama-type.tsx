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
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {chamaTypes.map((chamaType) => {
        const Icon = chamaType.icon
        const isSelected = formData.chamaType === chamaType.type

        return (
          <Card
            key={chamaType.type}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected && 'ring-2 ring-primary'
            )}
            onClick={() => updateField('chamaType', chamaType.type)}
          >
            <CardHeader>
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-lg',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle>{chamaType.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{chamaType.description}</CardDescription>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

