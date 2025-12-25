'use client'

import { ChamaCard } from './chama-card'
import { LoadingSpinner } from '../shared/loading-spinner'
import { EmptyState } from '../shared/empty-state'
import { Plus } from 'lucide-react'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'
import { useEffect, useState } from 'react'

interface ChamaStat {
  chamaId: string
  chamaName: string
  chamaType: 'savings' | 'merry_go_round' | 'hybrid'
  contributionPaid: number
  savingsPaid: number
  totalPaid: number
  actualSavings: number
}

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

interface ChamaListProps {
  chamas: ChamaWithMember[]
  chamaStats?: ChamaStat[]
  unconfirmedContributions?: Record<string, UnconfirmedContribution[]>
  loading?: boolean
}

export function ChamaList({ chamas, chamaStats, unconfirmedContributions, loading }: ChamaListProps) {
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchMemberCounts = async () => {
      const counts: Record<string, number> = {}
      for (const chama of chamas) {
        try {
          const response = await fetch(`/api/chamas/${chama.id}/members`)
          if (response.ok) {
            const data = await response.json()
            counts[chama.id] = data.data?.length || 0
          }
        } catch (error) {
          console.error(`Failed to fetch members for chama ${chama.id}:`, error)
        }
      }
      setMemberCounts(counts)
    }

    if (chamas.length > 0) {
      fetchMemberCounts()
    }
  }, [chamas])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (chamas.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="No chamas yet"
        description="Create your first chama or join an existing one to get started."
        action={{
          label: 'Create Chama',
          onClick: () => (window.location.href = '/chamas/new'),
        }}
      />
    )
  }

  const getSavingsForChama = (chamaId: string): number => {
    const stat = chamaStats?.find((s) => s.chamaId === chamaId)
    return stat?.actualSavings || 0
  }

  const getUnconfirmedForChama = (chamaId: string): UnconfirmedContribution[] => {
    return unconfirmedContributions?.[chamaId] || []
  }

  return (
    <div className="space-y-3">
      {chamas.map((chama) => (
        <ChamaCard
          key={chama.id}
          chama={chama}
          memberCount={memberCounts[chama.id]}
          savingsAmount={getSavingsForChama(chama.id)}
          unconfirmedContributions={getUnconfirmedForChama(chama.id)}
        />
      ))}
    </div>
  )
}

