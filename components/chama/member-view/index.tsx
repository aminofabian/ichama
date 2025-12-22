'use client'

import { CycleSummary } from './cycle-summary'
import { MemberPosition } from './member-position'
import { CyclesList } from '../cycles-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import type { Chama, ChamaMember } from '@/lib/types/chama'
import type { Cycle, CycleMember } from '@/lib/types/cycle'

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
  return (
    <div className="space-y-6">
      {activeCycle && (
        <div className="grid gap-6 md:grid-cols-2">
          <CycleSummary
            cycle={activeCycle}
            cycleMember={cycleMember}
            chamaType={chama.chama_type}
          />
          {cycleMember && (
            <MemberPosition
              cycleMember={cycleMember}
              totalMembers={totalMembers}
              chamaType={chama.chama_type}
            />
          )}
        </div>
      )}

      {!activeCycle && (
        <EmptyState
          title="No Active Cycle"
          description="There is no active contribution cycle. Wait for an admin to start a new cycle."
        />
      )}

      <CyclesList cycles={cycles} chamaId={chama.id} isAdmin={false} />

      {activeCycle && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button>Make Contribution</Button>
              <Button variant="outline">View History</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

