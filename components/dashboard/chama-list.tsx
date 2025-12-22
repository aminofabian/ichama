'use client'

import { ChamaCard } from './chama-card'
import { LoadingSpinner } from '../shared/loading-spinner'
import { EmptyState } from '../shared/empty-state'
import { Plus } from 'lucide-react'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'
import { useEffect, useState } from 'react'

interface ChamaListProps {
  chamas: ChamaWithMember[]
  loading?: boolean
}

export function ChamaList({ chamas, loading }: ChamaListProps) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {chamas.map((chama) => (
        <ChamaCard
          key={chama.id}
          chama={chama}
          memberCount={memberCounts[chama.id]}
        />
      ))}
    </div>
  )
}

