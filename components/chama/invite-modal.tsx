'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  chamaId: string
  inviteCode: string
}

export function InviteModal({ isOpen, onClose, chamaId, inviteCode }: InviteModalProps) {
  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleGenerateNew = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/chamas/${chamaId}/invite`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate new invite')
      }

      addToast({
        variant: 'success',
        title: 'New invite generated',
        description: 'A new invite link has been created.',
      })

      // Refresh the page to show new code
      window.location.reload()
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Failed to generate invite',
        description: err instanceof Error ? err.message : 'Please try again',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Invite Members</ModalTitle>
        </ModalHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Share this link to invite members to your chama
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted p-3">
                <code className="text-xs break-all">{inviteLink}</code>
              </div>
              <Button
                variant="default"
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
          </div>

          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium mb-1">Invite Code</p>
            <p className="text-lg font-mono font-bold">{inviteCode}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Members can also join using this code
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={handleGenerateNew} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New Link
                </>
              )}
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

