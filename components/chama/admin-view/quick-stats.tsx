'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, PiggyBank, Activity, HandCoins, DollarSign, Percent, AlertCircle, TrendingDown, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import { calculateLoanBreakdown } from '@/lib/utils/loan-utils'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import type { Cycle } from '@/lib/types/cycle'

interface QuickStatsProps {
  totalMembers: number
  activeCycle: Cycle | null
  collectionRate: number
  savingsPot: number
  chamaId: string
}

interface LoanStats {
  totalLoans: number
  activeLoans: number
  totalInterestEarned: number
  totalPrincipalLent: number
  totalOutstanding: number
  overdueLoans: number
  repaymentRate: number
}

export function QuickStats({
  totalMembers,
  activeCycle,
  collectionRate,
  savingsPot,
  chamaId,
}: QuickStatsProps) {
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null)
  const [loadingLoans, setLoadingLoans] = useState(true)

  useEffect(() => {
    async function fetchLoanStats() {
      try {
        setLoadingLoans(true)
        const response = await fetch(`/api/chamas/${chamaId}/loans`)
        const result = await response.json()

        if (response.ok && result.success) {
          // API returns { data: { loans: [...] } }
          const loans = result.data?.loans || []
          console.log('[Loan Stats] Fetched loans:', loans.length, 'from data:', result.data)
          
          let totalInterestEarned = 0
          let totalPrincipalLent = 0
          let totalOutstanding = 0
          let activeLoans = 0
          let overdueLoans = 0
          let totalPaid = 0
          let totalLoanAmount = 0

          loans.forEach((loan: any) => {
            const breakdown = calculateLoanBreakdown(
              loan.loanAmount,
              loan.interestRate || 0,
              loan.amountPaid || 0,
              loan.dueDate
            )

            totalPrincipalLent += loan.loanAmount
            totalLoanAmount += breakdown.originalTotal
            
            // Interest earned calculation
            if (loan.status === 'paid') {
              // For fully paid loans, count all interest
              totalInterestEarned += breakdown.originalInterest
              totalPaid += loan.amountPaid || 0
            } else if (loan.status === 'active' || loan.status === 'approved') {
              // For active loans, count interest proportionally based on amount paid
              const paidAmount = loan.amountPaid || 0
              if (paidAmount > 0 && breakdown.originalTotal > 0) {
                // Calculate interest earned proportionally
                const paymentRatio = paidAmount / breakdown.originalTotal
                totalInterestEarned += breakdown.originalInterest * paymentRatio
              }
              totalPaid += paidAmount
              activeLoans++
              totalOutstanding += breakdown.totalOutstanding
              
              // Check if overdue
              if (loan.dueDate) {
                const dueDate = new Date(loan.dueDate)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                dueDate.setHours(0, 0, 0, 0)
                if (dueDate < today && breakdown.totalOutstanding > 0) {
                  overdueLoans++
                }
              }
            }
          })

          const repaymentRate = totalLoanAmount > 0 
            ? ((totalPaid / totalLoanAmount) * 100) 
            : 0

          const stats = {
            totalLoans: loans.length,
            activeLoans,
            totalInterestEarned: Math.round(totalInterestEarned),
            totalPrincipalLent: Math.round(totalPrincipalLent),
            totalOutstanding: Math.round(totalOutstanding),
            overdueLoans,
            repaymentRate: Math.round(repaymentRate * 10) / 10,
          }
          console.log('[Loan Stats] Setting stats:', stats)
          setLoanStats(stats)
        } else {
          // Set empty stats if API call failed
          setLoanStats({
            totalLoans: 0,
            activeLoans: 0,
            totalInterestEarned: 0,
            totalPrincipalLent: 0,
            totalOutstanding: 0,
            overdueLoans: 0,
            repaymentRate: 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch loan stats:', error)
        // Set empty stats on error
        setLoanStats({
          totalLoans: 0,
          activeLoans: 0,
          totalInterestEarned: 0,
          totalPrincipalLent: 0,
          totalOutstanding: 0,
          overdueLoans: 0,
          repaymentRate: 0,
        })
      } finally {
        setLoadingLoans(false)
      }
    }

    if (chamaId) {
      fetchLoanStats()
    }
  }, [chamaId])

  const stats = [
    {
      label: 'Total Members',
      value: totalMembers.toString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Cycle Status',
      value: activeCycle ? `Period ${activeCycle.current_period}/${activeCycle.total_periods}` : 'No Active Cycle',
      icon: Activity,
      color: activeCycle ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400',
      bgColor: activeCycle ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-900/30',
      borderColor: activeCycle ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-800',
      badge: activeCycle?.status,
    },
    {
      label: 'Collection Rate',
      value: `${collectionRate}%`,
      icon: TrendingUp,
      color: collectionRate >= 80 ? 'text-green-600 dark:text-green-400' : collectionRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
      bgColor: collectionRate >= 80 ? 'bg-green-100 dark:bg-green-900/30' : collectionRate >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30',
      borderColor: collectionRate >= 80 ? 'border-green-200 dark:border-green-800' : collectionRate >= 50 ? 'border-yellow-200 dark:border-yellow-800' : 'border-red-200 dark:border-red-800',
    },
    {
      label: 'Savings Pot',
      value: formatCurrency(savingsPot),
      icon: PiggyBank,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    ...(loanStats ? [
      {
        label: 'Interest Earned',
        value: formatCurrency(loanStats.totalInterestEarned),
        icon: Percent,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        subtitle: `${loanStats.totalLoans} total loans`,
      },
      {
        label: 'Active Loans',
        value: loanStats.activeLoans.toString(),
        icon: HandCoins,
        color: loanStats.activeLoans > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400',
        bgColor: loanStats.activeLoans > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-900/30',
        borderColor: loanStats.activeLoans > 0 ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-800',
        subtitle: formatCurrency(loanStats.totalOutstanding) + ' outstanding',
        badge: loanStats.overdueLoans > 0 ? `${loanStats.overdueLoans} overdue` : undefined,
      },
      {
        label: 'Total Lent',
        value: formatCurrency(loanStats.totalPrincipalLent),
        icon: DollarSign,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        subtitle: `${loanStats.repaymentRate}% repaid`,
      },
      {
        label: 'Repayment Rate',
        value: `${loanStats.repaymentRate}%`,
        icon: loanStats.repaymentRate >= 80 ? TrendingUp : TrendingDown,
        color: loanStats.repaymentRate >= 80 ? 'text-green-600 dark:text-green-400' : loanStats.repaymentRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
        bgColor: loanStats.repaymentRate >= 80 ? 'bg-green-100 dark:bg-green-900/30' : loanStats.repaymentRate >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30',
        borderColor: loanStats.repaymentRate >= 80 ? 'border-green-200 dark:border-green-800' : loanStats.repaymentRate >= 50 ? 'border-yellow-200 dark:border-yellow-800' : 'border-red-200 dark:border-red-800',
        subtitle: loanStats.overdueLoans > 0 ? `${loanStats.overdueLoans} overdue` : 'All on track',
      },
    ] : []),
  ]

  return (
    <div className="space-y-3">
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {stats.slice(0, 4).map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`border ${stat.borderColor} shadow-md hover:shadow-lg transition-all overflow-hidden`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-md p-2 ${stat.bgColor} flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="text-sm font-bold truncate">{stat.value}</p>
                        {stat.badge && (
                          <Badge 
                            variant={stat.badge.includes('overdue') ? 'error' : 'default'} 
                            className="text-[9px] px-1.5 py-0.5"
                          >
                            {stat.badge}
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {loadingLoans ? (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : loanStats ? (
        <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
          {stats.slice(4).map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className={`border ${stat.borderColor} shadow-md hover:shadow-lg transition-all overflow-hidden bg-gradient-to-br from-card to-muted/20`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={`rounded-lg p-2.5 ${stat.bgColor} flex-shrink-0 shadow-sm`}>
                      <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold truncate">{stat.value}</p>
                        {stat.subtitle && (
                          <p className="text-[10px] text-muted-foreground truncate">{stat.subtitle}</p>
                        )}
                        {stat.badge && (
                          <Badge 
                            variant={stat.badge.includes('overdue') ? 'error' : 'default'} 
                            className="text-[9px] px-1.5 py-0.5 mt-1"
                          >
                            {stat.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

