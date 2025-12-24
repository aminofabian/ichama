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

  if (error || !data) {
    return (
      <div className="relative min-h-screen bg-background">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-[400px] px-4">
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
      {/* Enhanced Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Primary gradient orbs */}
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent blur-3xl animate-pulse delay-2000" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Top gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/60" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 pt-4 md:px-6 md:pt-8 pb-20 md:pb-12">
        {/* Header Section with enhanced spacing */}
        <div className="mb-6 md:mb-8">
          <ChamaHeader
            chama={chama}
            memberCount={members.length}
            isAdmin={isAdmin}
          />
        </div>

        {/* Content Section */}
        <div className="space-y-6 md:space-y-8">
          {isAdmin ? (
            <AdminView
              chama={chama}
              members={members}
              activeCycle={data.activeCycle}
              collectionRate={0}
              savingsPot={0}
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
