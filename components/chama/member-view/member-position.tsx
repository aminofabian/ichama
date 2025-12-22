'use client'

import { Trophy, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CycleMember } from '@/lib/types/cycle'
import type { ChamaType } from '@/lib/types/chama'

interface MemberPositionProps {
  cycleMember: CycleMember
  totalMembers: number
  chamaType: ChamaType
}

export function MemberPosition({
  cycleMember,
  totalMembers,
  chamaType,
}: MemberPositionProps) {
  const position = cycleMember.turn_order || 0
  const hasReceived = false // Payout status is tracked separately in Payout entity

  if (chamaType === 'savings') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Savings Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a savings-only chama. Your contributions go directly to your
            savings account.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Position</CardTitle>
          {hasReceived && (
            <Badge variant="success">Payout Received</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary">
            <div className="text-center">
              <Trophy className="mx-auto h-6 w-6 text-primary" />
              <span className="text-3xl font-bold">{position}</span>
              <span className="text-sm text-muted-foreground">/{totalMembers}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          {position === 1 ? (
            <p className="font-medium text-primary">
              You&apos;re first! You receive the payout this period.
            </p>
          ) : hasReceived ? (
            <p className="text-muted-foreground">
              You&apos;ve already received your payout this cycle.
            </p>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {position - 1} period{position - 1 !== 1 ? 's' : ''} until your payout
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: totalMembers }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full ${
                i + 1 === position
                  ? 'bg-primary'
                  : i + 1 < position
                  ? 'bg-primary/30'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

