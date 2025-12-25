'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Copy, Check, Play, Eye, EyeOff } from 'lucide-react'
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
  const [showInviteLink, setShowInviteLink] = useState(false)

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
      <Card className="border-border/50 shadow-md hover:shadow-lg transition-all">
        <CardContent className="pt-0 pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Buttons Section */}
            <div className="flex flex-wrap gap-1.5">
              {!hasActiveCycle && (
                <>
                  <Link href={`/chamas/${chamaId}/cycles/new`}>
                    <Button 
                      size="sm"
                      className="h-8 px-3 text-xs bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Create Cycle
                    </Button>
                  </Link>
                  {pendingCycle && (
                    <Button 
                      size="sm"
                      onClick={() => setShowStartCycleModal(true)}
                      className="h-8 px-3 text-xs bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all"
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Start Cycle
                    </Button>
                  )}
                </>
              )}

              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="h-8 px-3 text-xs bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all"
              >
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Invite
              </Button>

              <Link href={`/chamas/${chamaId}/members`}>
                <Button 
                  variant="primary"
                  size="sm"
                  className="h-8 px-3 text-xs bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  Members
                </Button>
              </Link>
            </div>

            {/* Invite Link Section */}
            <div className="flex-1 flex items-center gap-2 rounded-lg border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 p-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-xs">Invite Link</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInviteLink(!showInviteLink)}
                    className="h-6 w-6 p-0 hover:bg-muted"
                  >
                    {showInviteLink ? (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {showInviteLink && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 rounded-md bg-background/80 border border-border/30 p-1.5">
                        <code className="text-[10px] break-all font-mono leading-tight">{inviteLink}</code>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCopyLink}
                        className="h-7 px-2 bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all flex-shrink-0"
                      >
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Code: <span className="font-mono font-bold text-foreground">{inviteCode}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
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

