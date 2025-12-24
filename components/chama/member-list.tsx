'use client'

import { useState } from 'react'
import { MoreVertical, UserMinus, Shield, ShieldOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils/format'
import type { ChamaMember } from '@/lib/types/chama'

interface MemberWithUser extends ChamaMember {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface MemberListProps {
  chamaId: string
  members: MemberWithUser[]
  isAdmin: boolean
}

export function MemberList({ chamaId, members, isAdmin }: MemberListProps) {
  const { addToast } = useToast()
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemoveMember = async () => {
    if (!selectedMember) return

    setIsRemoving(true)
    try {
      const response = await fetch(`/api/chamas/${chamaId}/members/${selectedMember.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove member')
      }

      addToast({
        variant: 'success',
        title: 'Member removed',
        description: `${selectedMember.user?.full_name || 'Member'} has been removed from the chama.`,
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Failed to remove member',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsRemoving(false)
      setShowRemoveModal(false)
      setSelectedMember(null)
    }
  }

  return (
    <>
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Members ({members.length})</CardTitle>
          <CardDescription className="text-xs">All members of this chama</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/50">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={member.user?.full_name || 'Unknown'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{member.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user?.phone_number || 'No phone'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={member.role === 'admin' ? 'default' : 'info'} className="text-[10px] px-1.5 py-0">
                    {member.role}
                  </Badge>
                  <Badge
                    variant={
                      member.status === 'active'
                        ? 'success'
                        : member.status === 'removed'
                        ? 'error'
                        : 'default'
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {member.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground hidden md:inline">
                    {formatDate(member.joined_at)}
                  </span>

                  {isAdmin && member.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member)
                        setShowRemoveModal(true)
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                    >
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No members yet
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={showRemoveModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowRemoveModal(false)
            setSelectedMember(null)
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Remove Member</ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to remove{' '}
              <strong>{selectedMember?.user?.full_name || 'this member'}</strong> from the
              chama?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The member will need to rejoin through an
              invite link.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setShowRemoveModal(false)
                  setSelectedMember(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRemoveMember}
                disabled={isRemoving}
              >
                {isRemoving ? 'Removing...' : 'Remove Member'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

