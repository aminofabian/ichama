'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils/format'
import type { CreateChamaFormData } from '@/lib/hooks/use-create-chama-form'

interface StepContributionRulesProps {
  formData: CreateChamaFormData
  updateField: <K extends keyof CreateChamaFormData>(
    field: K,
    value: CreateChamaFormData[K]
  ) => void
  errors: Record<string, string>
}

export function StepContributionRules({
  formData,
  updateField,
  errors,
}: StepContributionRulesProps) {
  return (
    <div className="space-y-6">
      <div>
        <Input
          type="number"
          label="Contribution Amount (KES)"
          placeholder="330"
          value={formData.contributionAmount?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10)
            updateField('contributionAmount', isNaN(value) ? null : value)
          }}
          error={errors.contributionAmount}
          required
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Amount each member contributes per period
        </p>
      </div>

      {formData.contributionAmount && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold">Breakdown</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Payout</p>
              <p className="font-semibold">
                {formatCurrency(formData.payoutAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Savings</p>
              <p className="font-semibold">
                {formatCurrency(formData.savingsAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Service Fee</p>
              <p className="font-semibold">
                {formatCurrency(formData.serviceFee || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="frequency">Contribution Frequency</Label>
        <select
          id="frequency"
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={formData.frequency || ''}
          onChange={(e) =>
            updateField(
              'frequency',
              e.target.value as 'weekly' | 'biweekly' | 'monthly' | null
            )
          }
        >
          <option value="">Select frequency</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        {errors.frequency && (
          <p className="mt-1 text-sm text-destructive">{errors.frequency}</p>
        )}
      </div>
    </div>
  )
}

