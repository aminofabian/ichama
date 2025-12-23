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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Failed to load history"
        description={error}
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="No history available"
        description="Your history will appear here once you start using the platform."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground mt-1">
          View your complete chama history and transaction records
        </p>
      </div>

      <HistoryFilters
        chamas={data.chamas.map((c) => ({ id: c.id, name: c.name }))}
        onFilterChange={setFilters}
      />

      <div className="space-y-6">
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'chamas' ? 'primary' : 'ghost'}
            className="rounded-none border-b-2 border-transparent"
            style={
              activeTab === 'chamas'
                ? { borderBottomColor: 'var(--primary)' }
                : undefined
            }
            onClick={() => setActiveTab('chamas')}
          >
            Chamas ({data.chamas.length})
          </Button>
          <Button
            variant={activeTab === 'contributions' ? 'primary' : 'ghost'}
            className="rounded-none border-b-2 border-transparent"
            style={
              activeTab === 'contributions'
                ? { borderBottomColor: 'var(--primary)' }
                : undefined
            }
            onClick={() => setActiveTab('contributions')}
          >
            Contributions ({data.contributions.length})
          </Button>
          <Button
            variant={activeTab === 'payouts' ? 'primary' : 'ghost'}
            className="rounded-none border-b-2 border-transparent"
            style={
              activeTab === 'payouts'
                ? { borderBottomColor: 'var(--primary)' }
                : undefined
            }
            onClick={() => setActiveTab('payouts')}
          >
            Payouts ({data.payouts.length})
          </Button>
        </div>

        {activeTab === 'chamas' && <ChamaHistory chamas={data.chamas} />}
        {activeTab === 'contributions' && (
          <ContributionHistory contributions={data.contributions} />
        )}
        {activeTab === 'payouts' && <PayoutHistory payouts={data.payouts} />}
      </div>

      {error && data && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}

