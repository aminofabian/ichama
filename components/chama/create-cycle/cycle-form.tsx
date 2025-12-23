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

  return (
    <div className="space-y-6">
      <div>
        <Input
          label="Cycle Name"
          placeholder="e.g., Q1 2024 Savings Cycle"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
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

        <div>
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
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold">Breakdown</h3>
          <div className={`grid gap-4 text-sm ${isHybrid ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {!isSavingsOnly && (
              <div>
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
              <div>
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
            <div>
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
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">
                {formatCurrency(
                  (formData.payout_amount || 0) +
                    (formData.savings_amount || 0) +
                    (formData.service_fee || 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="frequency">Frequency</Label>
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

        <div>
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

