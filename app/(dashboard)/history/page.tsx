'use client'

import { useEffect, useState } from 'react'
import { ChamaHistory } from '@/components/history/chama-history'
import { ContributionHistory } from '@/components/history/contribution-history'
import { PayoutHistory } from '@/components/history/payout-history'
import { HistoryFilters, type HistoryFilters as HistoryFiltersType } from '@/components/history/history-filters'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'

interface HistoryData {
  chamas: ChamaWithMember[]
  cycles: Array<{
    id: string
    chama_id: string
    chama_name: string
    name: string
    status: string
    current_period: number
    total_periods: number
    contribution_amount: number
    payout_amount: number
    start_date: string | null
    end_date: string | null
    created_at: string
  }>
  contributions: Array<{
    id: string
    cycle_id: string
    cycle_name: string
    chama_name: string
    period_number: number
    amount_due: number
    amount_paid: number
    status: string
    due_date: string
    paid_at: string | null
    created_at: string
  }>
  payouts: Array<{
    id: string
    cycle_id: string
    cycle_name: string
    chama_name: string
    period_number: number
    amount: number
    status: string
    scheduled_date: string | null
    paid_at: string | null
    confirmed_at: string | null
    created_at: string
  }>
}

type Tab = 'chamas' | 'contributions' | 'payouts'

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chamas')
  const [data, setData] = useState<HistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<HistoryFiltersType>({})

  const fetchHistory = async (currentFilters: HistoryFiltersType) => {
    try {
      const params = new URLSearchParams()
      if (currentFilters.chama_id) params.append('chama_id', currentFilters.chama_id)
      if (currentFilters.status) params.append('status', currentFilters.status)
      if (currentFilters.start_date) params.append('start_date', currentFilters.start_date)
      if (currentFilters.end_date) params.append('end_date', currentFilters.end_date)

      const response = await fetch(`/api/user/history?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch history')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchHistory(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.chama_id, filters.status, filters.start_date, filters.end_date])

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl animate-pulse" />
          <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="relative min-h-screen bg-background">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-[400px] px-4">
          <EmptyState
            title="Failed to load history"
            description={error}
          />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="relative min-h-screen bg-background">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-[400px] px-4">
          <EmptyState
            title="No history available"
            description="Your history will appear here once you start using the platform."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/60" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 pt-4 md:px-6 md:pt-8 pb-20 md:pb-12">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="relative inline-block mb-2 md:mb-3">
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 rounded-xl md:rounded-2xl blur-xl opacity-60 animate-pulse" />
            <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg md:rounded-xl blur-md opacity-40" />
            <h1 className="relative bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-2xl md:text-4xl font-bold tracking-tight text-transparent">
              History
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            View your complete chama history and transaction records
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 md:mb-8">
          <HistoryFilters
            chamas={data.chamas.map((c) => ({ id: c.id, name: c.name }))}
            onFilterChange={setFilters}
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 md:mb-8">
          <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-1.5 inline-flex gap-1">
            <Button
              variant={activeTab === 'chamas' ? 'default' : 'ghost'}
              className={`relative rounded-lg transition-all ${
                activeTab === 'chamas'
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab('chamas')}
            >
              Chamas ({data.chamas.length})
            </Button>
            <Button
              variant={activeTab === 'contributions' ? 'default' : 'ghost'}
              className={`relative rounded-lg transition-all ${
                activeTab === 'contributions'
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab('contributions')}
            >
              Contributions ({data.contributions.length})
            </Button>
            <Button
              variant={activeTab === 'payouts' ? 'default' : 'ghost'}
              className={`relative rounded-lg transition-all ${
                activeTab === 'payouts'
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab('payouts')}
            >
              Payouts ({data.payouts.length})
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'chamas' && <ChamaHistory chamas={data.chamas} />}
          {activeTab === 'contributions' && (
            <ContributionHistory contributions={data.contributions} />
          )}
          {activeTab === 'payouts' && <PayoutHistory payouts={data.payouts} />}
        </div>

        {/* Error Message */}
        {error && data && (
          <div className="mt-6 rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive backdrop-blur-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

