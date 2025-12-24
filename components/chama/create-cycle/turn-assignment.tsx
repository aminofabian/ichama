'use client'

import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'

interface Member {
  chama_member_id: string
  user_id: string
  full_name: string
  phone_number: string
}

interface TurnAssignmentProps {
  members: Member[]
  turnOrder: Map<string, number>
  onTurnOrderChange: (memberId: string, turn: number) => void
  onShuffle: () => void
}

export function TurnAssignment({
  members,
  turnOrder,
  onTurnOrderChange,
  onShuffle,
}: TurnAssignmentProps) {
  const sortedMembers = [...members].sort(
    (a, b) => (turnOrder.get(a.chama_member_id) || 0) - (turnOrder.get(b.chama_member_id) || 0)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold">Turn Order</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign the order in which members will receive payouts
          </p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={onShuffle}
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
        >
          <Shuffle className="mr-2 h-4 w-4" />
          Random Shuffle
        </Button>
      </div>
      <div className="space-y-2.5">
        {sortedMembers.map((member, index) => {
          const currentTurn = turnOrder.get(member.chama_member_id) || index + 1
          return (
            <div
              key={member.chama_member_id}
              className="group flex items-center gap-3 rounded-lg border-2 border-border/50 bg-gradient-to-br from-card/80 to-card/50 p-3 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="relative flex-shrink-0">
                {currentTurn === 1 && (
                  <div className="absolute -inset-1 bg-primary/10 rounded-full blur-md animate-pulse" />
                )}
                <div className={`relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 font-bold transition-all ${
                  currentTurn === 1
                    ? 'border-primary bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg scale-110'
                    : 'border-primary/30 bg-muted text-foreground'
                }`}>
                  {currentTurn}
                </div>
              </div>
              <Avatar name={member.full_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{member.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.phone_number}</p>
              </div>
              <div className="w-20 md:w-24 flex-shrink-0">
                <Input
                  type="number"
                  min={1}
                  max={members.length}
                  value={currentTurn}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    if (!isNaN(value) && value >= 1 && value <= members.length) {
                      onTurnOrderChange(member.chama_member_id, value)
                    }
                  }}
                  className="text-center font-semibold"
                />
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/50 bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No members selected
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

