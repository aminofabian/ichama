'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Play, Pause, SkipForward, X, AlertTriangle } from 'lucide-react'
import type { Cycle } from '@/lib/types/cycle'

interface AdminControlsProps {
  cycle: Cycle
  onCycleUpdate?: () => void
}

export function AdminControls({ cycle, onCycleUpdate }: AdminControlsProps) {
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setIsLoading(action)

    try {
      const response = await fetch(`/api/cycles/${cycle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update cycle')
      }

      addToast({
        variant: 'success',
        title: 'Success',
        description: data.message || 'Cycle updated successfully',
      })

      onCycleUpdate?.()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update cycle',
      })
    } finally {
      setIsLoading(null)
    }
  }

  const canAdvance = cycle.status === 'active' && cycle.current_period < cycle.total_periods
  const canPause = cycle.status === 'active'
  const canResume = cycle.status === 'paused'
  const canCancel = cycle.status !== 'completed' && cycle.status !== 'cancelled'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cycle Controls</CardTitle>
        <CardDescription>Manage cycle status and progression</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {canAdvance && (
            <Button
              variant="default"
              className="w-full"
              onClick={() => handleAction('advance')}
              disabled={isLoading !== null}
            >
              {isLoading === 'advance' ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Advancing...</span>
                </>
              ) : (
                <>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Advance to Next Period
                </>
              )}
            </Button>
          )}

          {canPause && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleAction('pause')}
              disabled={isLoading !== null}
            >
              {isLoading === 'pause' ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Pausing...</span>
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Cycle
                </>
              )}
            </Button>
          )}

          {canResume && (
            <Button
              variant="default"
              className="w-full"
              onClick={() => handleAction('resume')}
              disabled={isLoading !== null}
            >
              {isLoading === 'resume' ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Resuming...</span>
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Resume Cycle
                </>
              )}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to cancel this cycle? This action cannot be undone.'
                  )
                ) {
                  handleAction('cancel')
                }
              }}
              disabled={isLoading !== null}
            >
              {isLoading === 'cancel' ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Cancelling...</span>
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Cycle
                </>
              )}
            </Button>
          )}

          {cycle.status === 'completed' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-300">
                This cycle has been completed.
              </p>
            </div>
          )}

          {cycle.status === 'cancelled' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700 dark:text-red-300">
                This cycle has been cancelled.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

