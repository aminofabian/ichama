'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChamaHeader } from '@/components/chama/chama-header'
import { MemberView } from '@/components/chama/member-view'
import { AdminView } from '@/components/chama/admin-view'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import type { Chama, ChamaMember } from '@/lib/types/chama'
import type { Cycle, CycleMember } from '@/lib/types/cycle'

interface MemberWithUser extends ChamaMember {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface ChamaData {
  chama: Chama
  member: ChamaMember
  members: MemberWithUser[]
  isAdmin: boolean
  activeCycle?: Cycle | null
  cycleMember?: CycleMember | null
}

export default function ChamaDetailPage() {
  const params = useParams()
  const chamaId = params.id as string
  const [data, setData] = useState<ChamaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchChama() {
      try {
        const response = await fetch(`/api/chamas/${chamaId}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch chama')
        }

        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chama')
      } finally {
        setIsLoading(false)
      }
    }

    if (chamaId) {
      fetchChama()
    }
  }, [chamaId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Chama not found"
        description={error || 'The chama you are looking for does not exist or you do not have access to it.'}
      />
    )
  }

  const { chama, member, members, isAdmin, activeCycle, cycleMember } = data

  return (
    <div className="space-y-6">
      <ChamaHeader
        chama={chama}
        memberCount={members.length}
        isAdmin={isAdmin}
      />

      {isAdmin ? (
        <AdminView
          chama={chama}
          members={members}
          activeCycle={activeCycle || null}
          collectionRate={0}
          savingsPot={0}
        />
      ) : (
        <MemberView
          chama={chama}
          member={member}
          activeCycle={activeCycle || null}
          cycleMember={cycleMember || null}
          totalMembers={members.length}
        />
      )}
    </div>
  )
}
