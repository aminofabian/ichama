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
  activeCycle: Cycle | null
  cycleMember: CycleMember | null
  cycles?: Cycle[]
  pendingCycle?: Cycle | null
  pendingCycleMembers?: (CycleMember & { user?: { full_name: string } })[] | null
  totalSavingsPot?: number
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
        const [chamaResponse, cyclesResponse] = await Promise.all([
          fetch(`/api/chamas/${chamaId}`),
          fetch(`/api/chamas/${chamaId}/cycles`),
        ])

        const chamaResult = await chamaResponse.json()
        const cyclesResult = await cyclesResponse.json()

        if (!chamaResponse.ok || !chamaResult.success) {
          throw new Error(chamaResult.error || 'Failed to fetch chama')
        }

        const chamaData = chamaResult.data
        const cyclesData = cyclesResult.success ? cyclesResult.data : null

        setData({
          ...chamaData,
          cycles: cyclesData?.cycles || [],
          pendingCycle: cyclesData?.pendingCycle || null,
          pendingCycleMembers: cyclesData?.pendingCycleMembers || null,
        })
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
      <div className="relative min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="relative min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <EmptyState
            title="Chama not found"
            description={error || 'The chama you are looking for does not exist or you do not have access to it.'}
          />
        </div>
      </div>
    )
  }

  const { chama, member, members, isAdmin, activeCycle, cycleMember, cycles = [], pendingCycle, pendingCycleMembers } = data

  return (
    <div className="relative min-h-screen bg-background">
      {/* Main Content Container */}
      <div className="relative mx-auto max-w-7xl px-3 pt-2 md:px-4 md:pt-4 pb-20 md:pb-8">
        {/* Header Section */}
        <div className="mb-4">
      <ChamaHeader
        chama={chama}
        memberCount={members.length}
        isAdmin={isAdmin}
      />
        </div>

        {/* Content Section */}
        <div className="space-y-4">
      {isAdmin ? (
        <AdminView
          chama={chama}
          members={members}
          activeCycle={data.activeCycle}
          collectionRate={0}
          savingsPot={data.totalSavingsPot || 0}
          cycles={cycles}
          pendingCycle={pendingCycle}
          pendingCycleMembers={pendingCycleMembers}
        />
      ) : (
        <MemberView
          chama={chama}
          member={member}
          activeCycle={data.activeCycle}
          cycleMember={data.cycleMember}
          cycles={cycles}
          totalMembers={members.length}
        />
      )}
        </div>
      </div>
    </div>
  )
}
