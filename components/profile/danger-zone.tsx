'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
} from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DangerZone() {
  const router = useRouter()
  const { addToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      addToast({
        variant: 'error',
        title: 'Invalid Confirmation',
        description: 'Please type DELETE to confirm account deletion.',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: confirmPassword }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete account')
      }

      addToast({
        variant: 'success',
        title: 'Account Deleted',
        description: 'Your account has been deleted successfully.',
      })

      // Redirect to home page after deletion
      router.push('/signin')
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Account Deletion Failed',
        description: error instanceof Error ? error.message : 'Failed to delete account. Please try again.',
      })
    } finally {
      setIsLoading(false)
      setIsModalOpen(false)
      setConfirmPassword('')
      setConfirmText('')
    }
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. All your data will be permanently deleted.
              </p>
              <Button
                variant="danger"
                onClick={() => setIsModalOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false)
            setConfirmPassword('')
            setConfirmText('')
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Account</ModalTitle>
            <ModalClose
              onClose={() => {
                setIsModalOpen(false)
                setConfirmPassword('')
                setConfirmText('')
              }}
            />
          </ModalHeader>
          <div className="space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account
              and all associated data including chamas, cycles, contributions, and payouts.
            </p>
          </div>

          <div>
            <Label htmlFor="delete-password">Enter Your Password</Label>
            <Input
              id="delete-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your password to confirm"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
            <Input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
              placeholder="Type DELETE"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={isLoading || !confirmPassword || confirmText !== 'DELETE'}
              className="flex-1"
            >
              {isLoading ? 'Deleting...' : 'Delete My Account'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setConfirmPassword('')
                setConfirmText('')
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

