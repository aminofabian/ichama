'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InviteModal } from '@/components/chama/invite-modal'
import { useToast } from '@/components/ui/toast'

interface AdminActionsProps {
  chamaId: string
  hasActiveCycle: boolean
  inviteCode: string
}

export function AdminActions({ chamaId, hasActiveCycle, inviteCode }: AdminActionsProps) {
  const { addToast } = useToast()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addToast({
        variant: 'success',
        title: 'Link copied!',
        description: 'Invite link has been copied to clipboard.',
      })
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Failed to copy',
        description: 'Please try again.',
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Manage your chama</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {!hasActiveCycle && (
              <Button asChild>
                <Link href={`/chamas/${chamaId}/cycles/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Cycle
                </Link>
              </Button>
            )}

            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              <Users className="mr-2 h-4 w-4" />
              Invite Members
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/chamas/${chamaId}/members`}>
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-sm">Invite Link</p>
                <p className="text-xs text-muted-foreground">
                  Share this link to invite members
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded bg-background p-2 mt-2">
              <code className="text-xs break-all">{inviteLink}</code>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Invite Code: <span className="font-mono font-bold">{inviteCode}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        chamaId={chamaId}
        inviteCode={inviteCode}
      />
    </>
  )
}

