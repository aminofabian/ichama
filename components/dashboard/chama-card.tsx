'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, PiggyBank, Clock, MessageSquare } from 'lucide-react'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'

interface UnconfirmedContribution {
  id: string
  cycle_id: string
  cycle_member_id: string
  user_id: string
  period_number: number
  amount_due: number
  amount_paid: number
  due_date: string
  status: string
  paid_at: string
  cycle_name: string
  contribution_amount: number
  savings_amount: number
  chama_id: string
  chama_name: string
  chama_type: 'savings' | 'merry_go_round' | 'hybrid'
  custom_savings_amount: number | null
}

interface ChamaCardProps {
  chama: ChamaWithMember
  memberCount?: number
  savingsAmount?: number
  unconfirmedContributions?: UnconfirmedContribution[]
}

interface CycleData {
  current_period: number
  total_periods: number
  status: string
  nextDueDate?: string
}

interface PendingContribution {
  due_date: string
  amount_due: number
  amount_paid: number
}

function getChamaIcon(chamaType: string) {
  const colors = [
    'bg-gradient-to-br from-red-400 to-orange-500',
    'bg-gradient-to-br from-orange-400 to-yellow-500',
    'bg-gradient-to-br from-yellow-400 to-green-500',
    'bg-gradient-to-br from-green-400 to-blue-500',
    'bg-gradient-to-br from-blue-400 to-purple-500',
  ]
  const index = chamaType.length % colors.length
  return colors[index]
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-500'
    case 'paused':
      return 'bg-orange-500'
    default:
      return 'bg-gray-400'
  }
}

function getDaysUntil(dateString: string): number {
  const dueDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  const diffTime = dueDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function ChamaCard({ chama, memberCount, savingsAmount = 0, unconfirmedContributions = [] }: ChamaCardProps) {
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  const handleSendReminder = async (e: React.MouseEvent, contributionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    try {
      setSendingReminder(contributionId)
      console.log('Sending reminder for contribution:', contributionId)
      
      const response = await fetch(`/api/contributions/${contributionId}/remind-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Reminder API response status:', response.status)
      const result = await response.json()
      console.log('Reminder API result:', result)
      
      if (response.ok && result.success) {
        const smsCount = result.data?.smsSent || 0
        const notificationCount = result.data?.notificationsSent || 0
        const adminCount = result.data?.adminsNotified || 1
        
        let message = `Reminder sent to ${adminCount} admin${adminCount !== 1 ? 's' : ''}!`
        if (smsCount > 0) {
          message += ` SMS sent to ${smsCount} admin${smsCount !== 1 ? 's' : ''}.`
        }
        if (notificationCount > 0 && smsCount === 0) {
          message += ` In-app notification sent.`
        }
        
        alert(message)
      } else {
        console.error('Reminder API error:', result)
        alert(result.error || 'Failed to send reminder. Please try again.')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('Failed to send reminder. Please check your connection and try again.')
    } finally {
      setSendingReminder(null)
    }
  }
  const [cycleData, setCycleData] = useState<CycleData | null>(null)
  const [nextContribution, setNextContribution] = useState<PendingContribution | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cyclesResponse = await fetch(`/api/chamas/${chama.id}/cycles`)
        if (cyclesResponse.ok) {
          const cyclesResult = await cyclesResponse.json()
          if (cyclesResult.success && cyclesResult.data?.length > 0) {
            const activeCycle = cyclesResult.data.find((c: any) => c.status === 'active')
            if (activeCycle) {
              setCycleData({
                current_period: activeCycle.current_period || 0,
                total_periods: activeCycle.total_periods || 1,
                status: activeCycle.status,
              })

              // Fetch pending contributions for this cycle
              const contributionsResponse = await fetch(
                `/api/cycles/${activeCycle.id}/contributions?status=pending`
              )
              if (contributionsResponse.ok) {
                const contributionsResult = await contributionsResponse.json()
                if (contributionsResult.success && contributionsResult.data?.contributions?.length > 0) {
                  const pending = contributionsResult.data.contributions
                    .filter((c: any) => (c.amount_paid || 0) < c.amount_due)
                    .sort((a: any, b: any) => 
                      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                    )[0]
                  if (pending) {
                    setNextContribution({
                      due_date: pending.due_date,
                      amount_due: pending.amount_due,
                      amount_paid: pending.amount_paid || 0,
                    })
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chama.id])

  const progress = cycleData
    ? Math.round((cycleData.current_period / cycleData.total_periods) * 100)
    : 0

  const daysUntil = nextContribution ? getDaysUntil(nextContribution.due_date) : null

  return (
    <Link href={`/chamas/${chama.id}`}>
      <div className="rounded-2xl bg-background p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getChamaIcon(chama.chama_type)}`}
          >
            <span className="text-xl font-bold text-white">
              {chama.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-bold text-foreground">{chama.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(chama.status)}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {chama.status === 'active' ? 'Active' : chama.status === 'paused' ? 'Paused' : 'Closed'} - {chama.member_role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            {/* Next Contribution Banner */}
            {chama.status === 'active' && nextContribution && daysUntil !== null && (
              <div className="mb-3 rounded-lg bg-[#F5E6D3] px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-orange-500" />
                  <span className="text-xs font-medium text-foreground">
                    Next contribution due in{' '}
                    <strong>
                      {daysUntil > 0
                        ? `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
                        : daysUntil === 0
                          ? 'today'
                          : `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Savings Amount */}
            {savingsAmount > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 px-3 py-2">
                <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div className="flex-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Saved</span>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(savingsAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* Unconfirmed Payments */}
            {unconfirmedContributions.length > 0 && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 px-3 py-2">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {unconfirmedContributions.length} Payment{unconfirmedContributions.length !== 1 ? 's' : ''} Awaiting Confirmation
                    </span>
                  </div>
                </div>
                {unconfirmedContributions.slice(0, 2).map((contrib) => (
                  <div
                    key={contrib.id}
                    className="flex items-center justify-between rounded-lg border border-yellow-200/50 dark:border-yellow-800/50 bg-yellow-50/30 dark:bg-yellow-950/10 px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        Period {contrib.period_number} • {formatCurrency(contrib.amount_paid)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {contrib.paid_at ? (
                          (() => {
                            const paidDate = new Date(contrib.paid_at)
                            const now = new Date()
                            const diffMs = now.getTime() - paidDate.getTime()
                            const diffHours = diffMs / (1000 * 60 * 60)
                            
                            // If more than 24 hours, show actual date instead
                            if (diffHours > 24) {
                              return `Paid on ${paidDate.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: paidDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })}`
                            }
                            return `Paid ${formatRelativeTime(contrib.paid_at)}`
                          })()
                        ) : 'Payment date unknown'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleSendReminder(e, contrib.id)}
                      disabled={sendingReminder === contrib.id}
                      className="ml-2 flex items-center gap-1 rounded-md bg-yellow-600 px-2 py-1 text-[10px] font-semibold text-white transition-all hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {sendingReminder === contrib.id ? 'Sending...' : 'Remind'}
                    </button>
                  </div>
                ))}
                {unconfirmedContributions.length > 2 && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    +{unconfirmedContributions.length - 2} more payment{unconfirmedContributions.length - 2 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Cycle Progress */}
            {cycleData && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Cycle Progress</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#FFD700] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
          </div>
          )}
          </div>
        </div>
      </div>
    </Link>
  )
}

