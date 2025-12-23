'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CheckCircle2, Clock, AlertCircle, XCircle, Filter } from 'lucide-react'
import type { Contribution } from '@/lib/types/contribution'

interface ContributionWithUser extends Contribution {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface ContributionTableProps {
  contributions: ContributionWithUser[]
  isAdmin?: boolean
  onConfirm?: (contributionId: string) => void
  onRefresh?: () => void
}

export function ContributionTable({
  contributions,
  isAdmin = false,
  onConfirm,
  onRefresh,
}: ContributionTableProps) {
  const { addToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const filteredContributions = contributions.filter((c) => {
    if (statusFilter === 'all') return true
    return c.status === statusFilter
  })

  const handleConfirm = async (contributionId: string) => {
    setConfirmingId(contributionId)

    try {
      const response = await fetch(`/api/contributions/${contributionId}/confirm`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm contribution')
      }

      addToast({
        variant: 'success',
        title: 'Contribution Confirmed',
        description: 'The contribution has been confirmed successfully.',
      })

      onConfirm?.(contributionId)
      onRefresh?.()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm contribution',
      })
    } finally {
      setConfirmingId(null)
    }
  }

  const getStatusBadge = (status: Contribution['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="success">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Confirmed
          </Badge>
        )
      case 'paid':
        return (
          <Badge variant="info">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case 'partial':
        return (
          <Badge variant="warning">
            <AlertCircle className="mr-1 h-3 w-3" />
            Partial
          </Badge>
        )
      case 'late':
        return (
          <Badge variant="error">
            <Clock className="mr-1 h-3 w-3" />
            Late
          </Badge>
        )
      case 'missed':
        return (
          <Badge variant="error">
            <XCircle className="mr-1 h-3 w-3" />
            Missed
          </Badge>
        )
      default:
        return (
          <Badge variant="default">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
    }
  }

  if (contributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No contributions found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contributions</CardTitle>
            <CardDescription>All contributions for this period</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="confirmed">Confirmed</option>
              <option value="partial">Partial</option>
              <option value="late">Late</option>
              <option value="missed">Missed</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Member</th>
                <th className="text-center p-3 font-semibold">Period</th>
                <th className="text-right p-3 font-semibold">Amount Due</th>
                <th className="text-right p-3 font-semibold">Amount Paid</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-center p-3 font-semibold">Due Date</th>
                {isAdmin && <th className="text-center p-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredContributions.map((contribution) => (
                <tr key={contribution.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={contribution.user?.full_name || 'Unknown'}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {contribution.user?.full_name || 'Unknown Member'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contribution.user?.phone_number || ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <Badge variant="default">{contribution.period_number}</Badge>
                  </td>
                  <td className="text-right p-3 font-medium">
                    {formatCurrency(contribution.amount_due)}
                  </td>
                  <td className="text-right p-3">
                    <span className={contribution.amount_paid > 0 ? 'text-green-600 font-medium' : ''}>
                      {formatCurrency(contribution.amount_paid)}
                    </span>
                    {contribution.amount_paid < contribution.amount_due && (
                      <p className="text-xs text-muted-foreground">
                        ({formatCurrency(contribution.amount_due - contribution.amount_paid)} remaining)
                      </p>
                    )}
                  </td>
                  <td className="text-center p-3">
                    {getStatusBadge(contribution.status)}
                  </td>
                  <td className="text-center p-3">
                    <p className="text-sm">{formatDate(contribution.due_date)}</p>
                    {new Date(contribution.due_date) < new Date() && contribution.status === 'pending' && (
                      <p className="text-xs text-red-600">Overdue</p>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="text-center p-3">
                      {contribution.status === 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(contribution.id)}
                          disabled={confirmingId === contribution.id}
                        >
                          {confirmingId === contribution.id ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Confirming...</span>
                            </>
                          ) : (
                            'Confirm'
                          )}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

