'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CheckCircle2, Clock, XCircle, AlertCircle, Gift } from 'lucide-react'
import type { Cycle } from '@/lib/types/cycle'
import type { CycleMember } from '@/lib/types/cycle'
import type { Contribution, Payout } from '@/lib/types/contribution'

interface MemberWithContributions extends CycleMember {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
  contributions: Contribution[]
  payout?: Payout | null
}

interface MemberStatusTableProps {
  cycle: Cycle
  members: MemberWithContributions[]
  isAdmin?: boolean
  onMemberAction?: (memberId: string, action: string) => void
}

export function MemberStatusTable({
  cycle,
  members,
  isAdmin = false,
  onMemberAction,
}: MemberStatusTableProps) {
  const getContributionStatus = (member: MemberWithContributions, period: number) => {
    const contribution = member.contributions.find((c) => c.period_number === period)
    if (!contribution) return null

    switch (contribution.status) {
      case 'paid':
      case 'confirmed':
        return { icon: CheckCircle2, color: 'text-green-500', label: 'Paid' }
      case 'partial':
        return { icon: AlertCircle, color: 'text-orange-500', label: 'Partial' }
      case 'late':
        return { icon: Clock, color: 'text-orange-500', label: 'Late' }
      case 'missed':
        return { icon: XCircle, color: 'text-red-500', label: 'Missed' }
      default:
        return { icon: Clock, color: 'text-gray-500', label: 'Pending' }
    }
  }

  const periods = Array.from({ length: cycle.total_periods }, (_, i) => i + 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Status</CardTitle>
        <CardDescription>Contribution status for all cycle members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Member</th>
                <th className="text-center p-3 font-semibold">Turn</th>
                {periods.map((period) => (
                  <th key={period} className="text-center p-2 font-semibold text-sm min-w-[80px]">
                    P{period}
                    {period === cycle.current_period && (
                      <Badge variant="info" className="ml-1 text-xs">
                        Current
                      </Badge>
                    )}
                  </th>
                ))}
                <th className="text-center p-3 font-semibold">Payout</th>
                {isAdmin && <th className="text-center p-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const totalPaid = member.contributions.reduce(
                  (sum, c) => sum + (c.amount_paid || 0),
                  0
                )
                const totalDue = member.contributions.reduce(
                  (sum, c) => sum + c.amount_due,
                  0
                )

                return (
                  <tr key={member.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.user?.full_name || 'Unknown'}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {member.user?.full_name || 'Unknown Member'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {totalPaid > 0
                              ? `${formatCurrency(totalPaid)} / ${formatCurrency(totalDue)}`
                              : formatCurrency(totalDue)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="primary">{member.turn_order}</Badge>
                    </td>
                    {periods.map((period) => {
                      const status = getContributionStatus(member, period)
                      const contribution = member.contributions.find(
                        (c) => c.period_number === period
                      )

                      return (
                        <td key={period} className="text-center p-2">
                          {status ? (
                            <div className="flex flex-col items-center gap-1" title={status.label}>
                              <status.icon
                                className={`h-4 w-4 ${status.color}`}
                              />
                              {contribution && contribution.amount_paid > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(contribution.amount_paid)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="text-center p-3">
                      {member.payout ? (
                        <div className="flex flex-col items-center gap-1">
                          <Gift
                            className={`h-4 w-4 ${
                              member.payout.status === 'paid' ||
                              member.payout.status === 'confirmed'
                                ? 'text-green-500'
                                : 'text-gray-500'
                            }`}
                          />
                          <Badge
                            variant={
                              member.payout.status === 'paid' ||
                              member.payout.status === 'confirmed'
                                ? 'success'
                                : 'default'
                            }
                            className="text-xs"
                          >
                            {member.payout.status}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="text-center p-3">
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => onMemberAction?.(member.id, 'view_details')}
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-gray-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-orange-500" />
            <span>Partial/Late</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-3 w-3 text-red-500" />
            <span>Missed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

