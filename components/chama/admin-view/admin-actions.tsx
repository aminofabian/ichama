'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Copy, Check, Play } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InviteModal } from '@/components/chama/invite-modal'
import { StartCycleConfirmation } from '@/components/chama/start-cycle-confirmation'
import { useToast } from '@/components/ui/toast'
import type { Cycle } from '@/lib/types/cycle'
import type { CycleMember } from '@/lib/types/cycle'

interface AdminActionsProps {
  chamaId: string
  hasActiveCycle: boolean
  inviteCode: string
  pendingCycle?: Cycle | null
  pendingCycleMembers?: (CycleMember & { user?: { full_name: string } })[] | null
}

export function AdminActions({
  chamaId,
  hasActiveCycle,
  inviteCode,
  pendingCycle,
  pendingCycleMembers,
}: AdminActionsProps) {
  const { addToast } = useToast()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showStartCycleModal, setShowStartCycleModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

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
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Admin Actions</CardTitle>
          <CardDescription className="text-xs">Manage your chama</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2.5">
            {!hasActiveCycle && (
              <>
                <Link href={`/chamas/${chamaId}/cycles/new`}>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Cycle
                  </Button>
                </Link>
                {pendingCycle && (
                  <Button 
                    size="sm"
                    onClick={() => setShowStartCycleModal(true)}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Cycle
                  </Button>
                )}
              </>
            )}

            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
            >
              <Users className="mr-2 h-4 w-4" />
              Invite Members
            </Button>

            <Link href={`/chamas/${chamaId}/members`}>
              <Button 
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="font-semibold text-sm">Invite Link</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share this link to invite members
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyLink}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
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
            <div className="rounded-lg bg-background/80 border border-border/30 p-2.5 mt-2">
              <code className="text-xs break-all font-mono">{inviteLink}</code>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              Invite Code: <span className="font-mono font-bold text-foreground">{inviteCode}</span>
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

      {pendingCycle && pendingCycleMembers && (
        <StartCycleConfirmation
          isOpen={showStartCycleModal}
          onClose={() => setShowStartCycleModal(false)}
          onConfirm={async () => {
            setIsStarting(true)
            try {
              const response = await fetch(`/api/cycles/${pendingCycle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' }),
              })

              const result = await response.json()

              if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to start cycle')
              }

              addToast({
                variant: 'success',
                title: 'Cycle started!',
                description: 'The cycle is now active and members can start contributing.',
              })

              setShowStartCycleModal(false)
              window.location.reload()
            } catch (err) {
              addToast({
                variant: 'error',
                title: 'Failed to start cycle',
                description: err instanceof Error ? err.message : 'Please try again',
              })
            } finally {
              setIsStarting(false)
            }
          }}
          cycle={pendingCycle}
          members={pendingCycleMembers}
          isStarting={isStarting}
        />
      )}
    </>
  )
}

