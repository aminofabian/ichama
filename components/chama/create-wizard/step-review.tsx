'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import type { CreateChamaFormData } from '@/lib/hooks/use-create-chama-form'

interface StepReviewProps {
  formData: CreateChamaFormData
  onEdit: (step: number) => void
}

const chamaTypeLabels = {
  savings: 'Savings',
  merry_go_round: 'Merry-go-round',
  hybrid: 'Hybrid',
}

const frequencyLabels = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
}

export function StepReview({ formData, onEdit }: StepReviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Basic Information</CardTitle>
          <button
            onClick={() => onEdit(1)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{formData.name}</p>
          </div>
          {formData.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{formData.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Privacy</p>
            <Badge variant={formData.isPrivate ? 'default' : 'info'}>
              {formData.isPrivate ? 'Private' : 'Public'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chama Type</CardTitle>
          <button
            onClick={() => onEdit(2)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        </CardHeader>
        <CardContent>
          <Badge variant="info">
            {formData.chamaType
              ? chamaTypeLabels[formData.chamaType]
              : 'Not selected'}
          </Badge>
        </CardContent>
      </Card>

      {formData.contributionAmount && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contribution Rules</CardTitle>
            <button
              onClick={() => onEdit(3)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Contribution Amount</p>
              <p className="font-medium">
                {formatCurrency(formData.contributionAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="font-medium">
                {formData.frequency
                  ? frequencyLabels[formData.frequency]
                  : 'Not selected'}
              </p>
            </div>
            <div className="mt-4 rounded-lg border p-3">
              <p className="mb-2 text-sm font-semibold">Breakdown</p>
              <div className={`grid gap-4 text-sm ${formData.chamaType === 'hybrid' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {formData.chamaType !== 'savings' && (
                  <div>
                    <p className="text-muted-foreground">Payout</p>
                    <p className="font-semibold">
                      {formatCurrency(formData.payoutAmount || 0)}
                    </p>
                  </div>
                )}
                {formData.chamaType !== 'merry_go_round' && (
                  <div>
                    <p className="text-muted-foreground">Savings</p>
                    <p className="font-semibold">
                      {formatCurrency(formData.savingsAmount || 0)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Service Fee</p>
                  <p className="font-semibold">
                    {formatCurrency(formData.serviceFee || 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

