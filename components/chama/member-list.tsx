'use client'

import { useState } from 'react'
import { MoreVertical, UserMinus, Shield, ShieldOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
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
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>All members of this chama</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.user?.full_name || 'Unknown'} size="sm" />
                  <div>
                    <p className="font-medium">{member.user?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.user?.phone_number || 'No phone'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'admin' ? 'default' : 'info'}>
                    {member.role}
                  </Badge>
                  <Badge
                    variant={
                      member.status === 'active'
                        ? 'success'
                        : member.status === 'suspended'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {member.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {formatDate(member.joined_at)}
                  </span>

                  {isAdmin && member.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member)
                        setShowRemoveModal(true)
                      }}
                    >
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No members yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false)
          setSelectedMember(null)
        }}
        title="Remove Member"
      >
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
              variant="outline"
              onClick={() => {
                setShowRemoveModal(false)
                setSelectedMember(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove Member'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

