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
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Savings Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
            This is a savings-only chama. Your contributions go directly to your
            savings account.
          </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Your Position</CardTitle>
          {hasReceived && (
            <Badge variant="success" className="text-xs">Payout Received</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/10 rounded-full blur-lg animate-pulse" />
            <div className="relative flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-full border-4 border-primary bg-gradient-to-br from-primary/5 to-transparent">
            <div className="text-center">
                <Trophy className="mx-auto h-5 w-5 md:h-6 md:w-6 text-primary mb-1" />
                <span className="text-2xl md:text-3xl font-bold">{position}</span>
                <span className="text-xs md:text-sm text-muted-foreground">/{totalMembers}</span>
              </div>
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

