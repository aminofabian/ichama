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
    <div className="space-y-6">
      <div>
        <Input
          label="Chama Name"
          placeholder="e.g., Family Savings Group"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          className="mt-2 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe your chama's purpose and goals..."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="privacy">Private Chama</Label>
          <p className="text-sm text-muted-foreground">
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

