'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CycleSummary } from './cycle-summary'
import { MemberPosition } from './member-position'
import { CyclesList } from '../cycles-list'
import { MyContributionCard } from '@/components/cycle/my-contribution-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import type { Chama, ChamaMember } from '@/lib/types/chama'
import type { Cycle, CycleMember } from '@/lib/types/cycle'
import type { Contribution } from '@/lib/types/contribution'

interface MemberViewProps {
  chama: Chama
  member: ChamaMember
  activeCycle: Cycle | null
  cycleMember: CycleMember | null
  cycles?: Cycle[]
  totalMembers: number
}

export function MemberView({
  chama,
  member,
  activeCycle,
  cycleMember,
  cycles = [],
  totalMembers,
}: MemberViewProps) {
  const router = useRouter()
  const [currentContribution, setCurrentContribution] = useState<Contribution | null>(null)
  const [isLoadingContribution, setIsLoadingContribution] = useState(false)

  useEffect(() => {
    if (activeCycle && cycleMember) {
      fetchCurrentContribution()
    }
  }, [activeCycle?.id, cycleMember?.id])

  const fetchCurrentContribution = async () => {
    if (!activeCycle || !cycleMember) return

    setIsLoadingContribution(true)
    try {
      const response = await fetch(
        `/api/cycles/${activeCycle.id}/contributions?period=${activeCycle.current_period}`
      )
      const data = await response.json()

      if (data.success && data.data.contributions) {
        const myContribution = data.data.contributions.find(
          (c: Contribution) => c.user_id === member.user_id && c.period_number === activeCycle.current_period
        )
        setCurrentContribution(myContribution || null)
      }
    } catch (error) {
      console.error('Failed to fetch contribution:', error)
    } finally {
      setIsLoadingContribution(false)
    }
  }

  return (
    <div className="space-y-4">
      {activeCycle && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <CycleSummary
              cycle={activeCycle}
              cycleMember={cycleMember}
              chamaType={chama.chama_type}
              cycleId={activeCycle.id}
              chamaId={chama.id}
            />
            {cycleMember && (
              <MemberPosition
                cycleMember={cycleMember}
                totalMembers={totalMembers}
                chamaType={chama.chama_type}
              />
            )}
          </div>

          {/* My Contribution Card */}
          <MyContributionCard
            contribution={currentContribution}
            onUpdate={fetchCurrentContribution}
          />

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/chamas/${chama.id}/cycles/${activeCycle.id}`)}
              className="flex-1 sm:flex-none"
            >
              View Cycle Details
            </Button>
            <Button 
              variant="primary" 
              onClick={() => router.push(`/chamas/${chama.id}/cycles/${activeCycle.id}`)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-lg shadow-[#FFD700]/25 hover:shadow-xl hover:shadow-[#FFD700]/30 transition-all"
            >
              View All Contributions
            </Button>
          </div>
        </>
      )}

      {!activeCycle && (
        <EmptyState
          title="No Active Cycle"
          description="There is no active contribution cycle. Wait for an admin to start a new cycle."
        />
      )}

      <CyclesList cycles={cycles} chamaId={chama.id} isAdmin={false} />
    </div>
  )
}

