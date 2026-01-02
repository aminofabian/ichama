'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Settings, AlertTriangle, Percent, TrendingUp } from 'lucide-react'
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
  const [defaultInterestRate, setDefaultInterestRate] = useState('0')

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
        setDefaultInterestRate((result.data.chama.default_interest_rate || 0).toString())
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
          default_interest_rate: parseFloat(defaultInterestRate) || 0,
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
      <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pb-4 md:pb-12">
        {/* Animated Background Elements */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent blur-3xl animate-pulse" />
          <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent blur-3xl animate-pulse delay-2000" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-3 pt-4 md:px-6 md:pt-12">
          {/* Header */}
          <div className="mb-4 md:mb-8">
          <Link href={`/chamas/${chamaId}`}>
              <Button variant="ghost" size="sm" className="mb-4 hover:bg-muted/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chama
            </Button>
          </Link>
            <div className="relative inline-block mb-2 md:mb-3">
              <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 rounded-xl md:rounded-2xl blur-xl opacity-60 animate-pulse" />
              <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg md:rounded-xl blur-md opacity-40" />
              <h1 className="relative flex items-center gap-3 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-2xl md:text-4xl font-bold tracking-tight text-transparent">
                <Settings className="relative h-6 w-6 md:h-8 md:w-8 text-primary" />
                <span>Settings</span>
              </h1>
        </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Manage your chama settings and preferences
            </p>
        </div>

          {/* General Settings Card */}
          <div className="group relative mb-4 md:mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-xl md:rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <Card className="relative rounded-xl md:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 md:p-8 shadow-2xl">
              <div className="absolute inset-0 rounded-xl md:rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
              <CardHeader className="relative pb-4 md:pb-6">
                <CardTitle className="text-lg md:text-xl font-bold">General Settings</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Update your chama information and preferences
                </CardDescription>
          </CardHeader>
              <CardContent className="relative space-y-4 md:space-y-6">
                <div className="space-y-1.5">
              <Input
                label="Chama Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <textarea
                id="description"
                    className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                placeholder="Describe your chama..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3 md:p-5 transition-all hover:bg-muted/50">
                  <div className="space-y-0.5 flex-1 pr-4">
                    <Label htmlFor="privacy" className="text-sm md:text-base font-semibold">Private Chama</Label>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Only members with invite links can join
                </p>
              </div>
              <Switch
                id="privacy"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

                {/* Default Interest Rate */}
                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:border-purple-900 dark:from-purple-950/30 dark:to-purple-900/20 p-4 md:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                      <Percent className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="interestRate" className="text-sm md:text-base font-semibold">
                        Default Interest Rate
                      </Label>
                      <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                        This rate will be pre-filled when approving loans
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        id="interestRate"
                        type="number"
                        placeholder="0"
                        value={defaultInterestRate}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                            setDefaultInterestRate(value)
                          }
                        }}
                        min="0"
                        max="100"
                        step="0.5"
                        className="flex-1 h-12 text-lg font-semibold"
                      />
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">%</div>
                    </div>
                    {/* Quick Select Buttons */}
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 5, 10, 15, 20].map((rate) => (
                        <Button
                          key={rate}
                          type="button"
                          variant={defaultInterestRate === rate.toString() ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDefaultInterestRate(rate.toString())}
                          className="text-xs"
                        >
                          {rate}%
                        </Button>
                      ))}
                    </div>
                    {parseFloat(defaultInterestRate) > 0 && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                            Example Calculation
                          </p>
                        </div>
                        <p className="text-xs text-purple-800 dark:text-purple-200">
                          For a loan of Ksh 10,000: Interest = Ksh {((10000 * parseFloat(defaultInterestRate || '0')) / 100).toLocaleString()}, Total = Ksh {(10000 + (10000 * parseFloat(defaultInterestRate || '0') / 100)).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="group relative overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary/90 shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Save Changes</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      </>
                    )}
              </Button>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Danger Zone Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-destructive/20 via-red-500/20 to-destructive/20 rounded-xl md:rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <Card className="relative rounded-xl md:rounded-3xl border-2 border-destructive/50 bg-card/80 backdrop-blur-xl p-4 md:p-8 shadow-2xl">
              <div className="absolute inset-0 rounded-xl md:rounded-3xl bg-gradient-to-br from-destructive/5 via-transparent to-red-500/5 pointer-events-none" />
              <CardHeader className="relative pb-4 md:pb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
                  <CardTitle className="text-lg md:text-xl font-bold text-destructive">Danger Zone</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Irreversible actions that will affect your chama permanently
            </CardDescription>
          </CardHeader>
              <CardContent className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:p-5">
                  <div className="flex-1">
                    <p className="font-semibold text-sm md:text-base mb-1">Delete Chama</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Permanently delete this chama and all its data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                    className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chama
              </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      >
        <ModalContent className="border-2 border-destructive/50">
          <ModalHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <ModalTitle className="text-destructive">Delete Chama</ModalTitle>
            </div>
          </ModalHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm md:text-base">
              Are you sure you want to delete <strong className="text-destructive">{data.chama.name}</strong>?
            </p>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">
              This action cannot be undone. All chama data, including members, cycles,
              and contributions will be permanently deleted.
            </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
                className="group relative overflow-hidden w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

