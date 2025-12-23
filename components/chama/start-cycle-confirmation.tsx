'use client'

import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Cycle } from '@/lib/types/cycle'
import type { CycleMember } from '@/lib/types/cycle'

interface StartCycleConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  cycle: Cycle
  members: (CycleMember & { user?: { full_name: string } })[]
  isStarting?: boolean
}

export function StartCycleConfirmation({
  isOpen,
  onClose,
  onConfirm,
  cycle,
  members,
  isStarting = false,
}: StartCycleConfirmationProps) {
  const frequencyLabels = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Month',
  }

  // Calculate end date
  const startDate = new Date(cycle.start_date!)
  let daysToAdd = 0
  switch (cycle.frequency) {
    case 'weekly':
      daysToAdd = 7 * cycle.total_periods
      break
    case 'biweekly':
      daysToAdd = 14 * cycle.total_periods
      break
    case 'monthly':
      daysToAdd = 30 * cycle.total_periods
      break
  }
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysToAdd)

  const period1Recipient = members.find((m) => m.turn_order === 1)

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Start Cycle</ModalTitle>
        </ModalHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Review the cycle details before starting. Once started, the cycle will be
              active and members will be able to make contributions.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Cycle Name</p>
              <p className="text-lg">{cycle.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(cycle.start_date!)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{formatDate(endDate.toISOString())}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="font-medium">{frequencyLabels[cycle.frequency]}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Periods</p>
              <p className="font-medium">{cycle.total_periods}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Contribution Amount</p>
              <p className="font-medium">{formatCurrency(cycle.contribution_amount)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="font-medium">{members.length} members</p>
            </div>

            {period1Recipient && (
              <div>
                <p className="text-sm text-muted-foreground">Period 1 Payout Recipient</p>
                <p className="font-medium">
                  {period1Recipient.user?.full_name || 'Unknown'} - {formatCurrency(cycle.payout_amount)}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="default" onClick={onClose} disabled={isStarting}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isStarting}>
              {isStarting ? 'Starting...' : 'Start Cycle'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

