'use client'

import { useEffect, useState } from 'react'
import { SavingsCard } from '@/components/wallet/savings-card'
import { TransactionList } from '@/components/wallet/transaction-list'
import { TransactionFilters, type TransactionFilters as TransactionFiltersType } from '@/components/wallet/transaction-filters'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { SavingsAccount, SavingsTransaction } from '@/lib/types/financial'
import type { WalletTransaction } from '@/lib/types/financial'

interface WalletData {
  account: SavingsAccount
  savingsTransactions: SavingsTransaction[]
}

interface WalletTransactionsData {
  transactions: WalletTransaction[]
  balance: number
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactionsData, setTransactionsData] = useState<WalletTransactionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TransactionFiltersType>({})

  const fetchSavingsData = async () => {
    try {
      const response = await fetch('/api/savings?limit=5')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch savings')
      }

      setWalletData(result.data)
    } catch (err) {
      console.error('Failed to fetch savings:', err)
    }
  }

  const fetchWalletTransactions = async (currentFilters: TransactionFiltersType) => {
    try {
      const params = new URLSearchParams()
      if (currentFilters.type) params.append('type', currentFilters.type)
      if (currentFilters.chama_id) params.append('chama_id', currentFilters.chama_id)
      if (currentFilters.start_date) params.append('start_date', currentFilters.start_date)
      if (currentFilters.end_date) params.append('end_date', currentFilters.end_date)

      const response = await fetch(`/api/wallet?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch transactions')
      }

      setTransactionsData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      await Promise.all([fetchSavingsData(), fetchWalletTransactions(filters)])
      setIsLoading(false)
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.chama_id, filters.start_date, filters.end_date])

  const handleExportCSV = () => {
    if (!transactionsData || transactionsData.transactions.length === 0) {
      return
    }

    // CSV headers
    const headers = ['Date', 'Type', 'Direction', 'Amount', 'Description', 'Chama ID', 'Cycle ID']
    const rows = transactionsData.transactions.map((tx) => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.type,
      tx.direction,
      (tx.amount / 100).toFixed(2),
      tx.description || '',
      tx.chama_id || '',
      tx.cycle_id || '',
    ])

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !walletData && !transactionsData) {
    return (
      <EmptyState
        title="Failed to load wallet"
        description={error}
      />
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20 md:pb-8">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet & Savings</h1>
            <p className="text-muted-foreground mt-1">
              View your savings balance and transaction history
            </p>
          </div>
          {transactionsData && transactionsData.transactions.length > 0 && (
            <Button 
              variant="primary" 
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

      {walletData && (
        <SavingsCard
          account={walletData.account}
          recentTransactions={walletData.savingsTransactions}
        />
      )}

      <TransactionFilters onFilterChange={setFilters} />

      {transactionsData && (
        <TransactionList
          transactions={transactionsData.transactions}
          balance={transactionsData.balance}
        />
      )}

      {error && (walletData || transactionsData) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      </div>
    </div>
  )
}

