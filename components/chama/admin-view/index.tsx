'use client'

import { AdminActions } from './admin-actions'
import { QuickStats } from './quick-stats'
import { MemberList } from '../member-list'
import { CyclesList } from '../cycles-list'
import type { Chama, ChamaMember } from '@/lib/types/chama'
import type { Cycle, CycleMember } from '@/lib/types/cycle'
import type { User } from '@/lib/types/user'

interface MemberWithUser extends ChamaMember {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface AdminViewProps {
  chama: Chama
  members: MemberWithUser[]
  activeCycle: Cycle | null
  collectionRate: number
  savingsPot: number
  cycles?: Cycle[]
  pendingCycle?: Cycle | null
  pendingCycleMembers?: (CycleMember & { user?: { full_name: string } })[] | null
}

export function AdminView({
  chama,
  members,
  activeCycle,
  collectionRate,
  savingsPot,
  cycles = [],
  pendingCycle,
  pendingCycleMembers,
}: AdminViewProps) {
  return (
    <div className="space-y-4">
      <QuickStats
        totalMembers={members.length}
        activeCycle={activeCycle}
        collectionRate={collectionRate}
        savingsPot={savingsPot}
      />

      <AdminActions
        chamaId={chama.id}
        hasActiveCycle={!!activeCycle}
        inviteCode={chama.invite_code}
        pendingCycle={pendingCycle}
        pendingCycleMembers={pendingCycleMembers}
      />

      <CyclesList cycles={cycles} chamaId={chama.id} isAdmin={true} />

      <MemberList
        chamaId={chama.id}
        members={members}
        isAdmin={true}
      />
    </div>
  )
}

