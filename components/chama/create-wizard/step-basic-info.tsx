'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { CreateChamaFormData } from '@/lib/hooks/use-create-chama-form'

interface StepBasicInfoProps {
  formData: CreateChamaFormData
  updateField: <K extends keyof CreateChamaFormData>(
    field: K,
    value: CreateChamaFormData[K]
  ) => void
  errors: Record<string, string>
}

export function StepBasicInfo({
  formData,
  updateField,
  errors,
}: StepBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Input
          label="Chama Name"
          placeholder="e.g., Family Savings Group"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
        <textarea
          id="description"
          className="flex min-h-[80px] md:min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          placeholder="Describe your chama's purpose and goals..."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-gradient-to-r from-muted/40 to-muted/20 p-3.5 transition-all hover:bg-muted/60 hover:border-primary/20">
        <div className="space-y-0.5 flex-1 pr-4">
          <Label htmlFor="privacy" className="text-sm font-semibold">Private Chama</Label>
          <p className="text-xs text-muted-foreground">
            Only members with invite links can join
          </p>
        </div>
        <Switch
          id="privacy"
          checked={formData.isPrivate}
          onCheckedChange={(checked) => updateField('isPrivate', checked)}
        />
      </div>
    </div>
  )
}

