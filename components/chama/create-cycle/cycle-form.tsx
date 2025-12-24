'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils/format'
import type { Chama } from '@/lib/types/chama'

interface CycleFormProps {
  chama: Chama
  formData: {
    name: string
    contribution_amount: number | null
    payout_amount: number | null
    savings_amount: number | null
    service_fee: number | null
    frequency: 'weekly' | 'biweekly' | 'monthly' | null
    start_date: string
    total_periods: number | null
  }
  updateField: (field: string, value: unknown) => void
  errors: Record<string, string>
}

export function CycleForm({
  chama,
  formData,
  updateField,
  errors,
}: CycleFormProps) {
  const isSavingsOnly = chama.chama_type === 'savings'
  const isMerryGoRound = chama.chama_type === 'merry_go_round'
  const isHybrid = chama.chama_type === 'hybrid'

  const total =
    (formData.payout_amount || 0) +
    (formData.savings_amount || 0) +
    (formData.service_fee || 0)
  const hasMismatch = formData.contribution_amount !== null && total !== formData.contribution_amount

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Input
          label="Cycle Name"
          placeholder="e.g., Q1 2024 Savings Cycle"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          required
        />
      </div>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Input
            type="number"
            label="Contribution Amount (KES)"
            placeholder="330"
            value={formData.contribution_amount?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('contribution_amount', isNaN(value) ? null : value)
            }}
            error={errors.contribution_amount}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Input
            type="number"
            label="Total Periods"
            placeholder="12"
            value={formData.total_periods?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('total_periods', isNaN(value) ? null : value)
            }}
            error={errors.total_periods}
            required
          />
        </div>
      </div>

      {formData.contribution_amount && (
        <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 p-3.5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            Breakdown
          </h3>
          <div className={`grid gap-2.5 ${isHybrid ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {!isSavingsOnly && (
              <div className="space-y-1.5">
                <Input
                  type="number"
                  label="Payout Amount"
                  value={formData.payout_amount?.toString() || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    updateField('payout_amount', isNaN(value) ? null : value)
                  }}
                  error={errors.payout_amount}
                  required
                />
              </div>
            )}
            {!isMerryGoRound && (
              <div className="space-y-1.5">
                <Input
                  type="number"
                  label="Savings Amount"
                  value={formData.savings_amount?.toString() || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    updateField('savings_amount', isNaN(value) ? null : value)
                  }}
                  error={errors.savings_amount}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Input
                type="number"
                label="Service Fee"
                value={formData.service_fee?.toString() || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  updateField('service_fee', isNaN(value) ? null : value)
                }}
                error={errors.service_fee}
                required
              />
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Breakdown</span>
              <span className={`text-sm font-bold ${hasMismatch ? 'text-destructive' : ''}`}>
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Contribution Amount</span>
              <span className="text-sm font-bold">
                {formatCurrency(formData.contribution_amount)}
              </span>
            </div>
            {hasMismatch && (
              <div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-[10px] text-destructive font-medium">
                  ⚠️ Total breakdown ({formatCurrency(total)}) does not match contribution amount ({formatCurrency(formData.contribution_amount)})
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="frequency" className="text-sm font-medium">Frequency</Label>
          <select
            id="frequency"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
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
            <p className="text-xs text-destructive">{errors.frequency}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Input
            type="date"
            label="Start Date"
            value={formData.start_date}
            onChange={(e) => updateField('start_date', e.target.value)}
            error={errors.start_date}
            required
          />
        </div>
      </div>
    </div>
  )
}

