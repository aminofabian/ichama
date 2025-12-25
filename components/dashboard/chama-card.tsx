'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, PiggyBank } from 'lucide-react'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'
import { formatCurrency } from '@/lib/utils/format'

interface ChamaCardProps {
  chama: ChamaWithMember
  memberCount?: number
  savingsAmount?: number
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

export function ChamaCard({ chama, memberCount, savingsAmount = 0 }: ChamaCardProps) {
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

