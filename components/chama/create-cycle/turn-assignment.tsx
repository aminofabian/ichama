'use client'

import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Turn Order</CardTitle>
            <CardDescription>
              Assign the order in which members will receive payouts
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onShuffle}>
            <Shuffle className="mr-2 h-4 w-4" />
            Random Shuffle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedMembers.map((member, index) => {
            const currentTurn = turnOrder.get(member.chama_member_id) || index + 1
            return (
              <div
                key={member.chama_member_id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {currentTurn}
                </div>
                <Avatar name={member.full_name} size="sm" />
                <div className="flex-1">
                  <p className="font-medium">{member.full_name}</p>
                  <p className="text-sm text-muted-foreground">{member.phone_number}</p>
                </div>
                <div className="w-24">
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
                  />
                </div>
              </div>
            )
          })}

          {members.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No members selected
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

