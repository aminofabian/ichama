'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'

interface Member {
  id: string
  chama_member_id: string
  user_id: string
  full_name: string
  phone_number: string
  role: string
}

interface MemberSelectorProps {
  members: Member[]
  selectedMemberIds: Set<string>
  onToggle: (memberId: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
}

export function MemberSelector({
  members,
  selectedMemberIds,
  onToggle,
  onSelectAll,
  onSelectNone,
}: MemberSelectorProps) {
  const allSelected = members.length > 0 && selectedMemberIds.size === members.length
  const someSelected = selectedMemberIds.size > 0 && selectedMemberIds.size < members.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Members</CardTitle>
            <CardDescription>
              Choose members to include in this cycle ({selectedMemberIds.size} selected)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={onSelectAll}>
              Select All
            </Button>
            <Button variant="primary" size="sm" onClick={onSelectNone}>
              Select None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedMemberIds.has(member.chama_member_id)}
                onCheckedChange={() => onToggle(member.chama_member_id)}
              />
              <Avatar name={member.full_name} size="sm" />
              <div className="flex-1">
                <p className="font-medium">{member.full_name}</p>
                <p className="text-sm text-muted-foreground">{member.phone_number}</p>
              </div>
              {member.role === 'admin' && (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Admin
                </span>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No members found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

