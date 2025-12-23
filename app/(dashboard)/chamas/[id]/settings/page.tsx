'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/components/ui/toast'
import type { Chama, ChamaMember } from '@/lib/types/chama'

interface SettingsData {
  chama: Chama
  member: ChamaMember
}

export default function ChamaSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const chamaId = params.id as string
  const [data, setData] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)

  useEffect(() => {
    async function fetchChama() {
      try {
        const response = await fetch(`/api/chamas/${chamaId}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch chama')
        }

        if (result.data.member.role !== 'admin') {
          throw new Error('Only admins can access settings')
        }

        setData(result.data)
        setName(result.data.chama.name)
        setDescription(result.data.chama.description || '')
        setIsPrivate(!!result.data.chama.is_private)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    if (chamaId) {
      fetchChama()
    }
  }, [chamaId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/chamas/${chamaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          is_private: isPrivate ? 1 : 0,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update settings')
      }

      addToast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Your chama settings have been updated.',
      })
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Failed to save',
        description: err instanceof Error ? err.message : 'Please try again',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/chamas/${chamaId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete chama')
      }

      addToast({
        variant: 'success',
        title: 'Chama deleted',
        description: 'The chama has been permanently deleted.',
      })

      router.push('/dashboard')
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Failed to delete',
        description: err instanceof Error ? err.message : 'Please try again',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Access denied"
        description={error || 'You do not have permission to access these settings.'}
      />
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/chamas/${chamaId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chama
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your chama settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Update your chama information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Input
                label="Chama Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="mt-2 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe your chama..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="privacy">Private Chama</Label>
                <p className="text-sm text-muted-foreground">
                  Only members with invite links can join
                </p>
              </div>
              <Switch
                id="privacy"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will affect your chama
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Chama</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this chama and all its data
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chama
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Chama</ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete <strong>{data.chama.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All chama data, including members, cycles,
              and contributions will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

