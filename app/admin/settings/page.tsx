'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/components/ui/toast'
import { Settings, Save } from 'lucide-react'

interface PlatformSettings {
  [key: string]: {
    value: string | number | boolean
    description?: string
    updated_at?: string
  }
}

export default function AdminSettingsPage() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch settings')
        }

        setSettings(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async (key: string) => {
    setIsSaving(true)
    try {
      const value = editedValues[key]
      if (value === undefined) return

      // Try to parse as number or boolean, otherwise keep as string
      let parsedValue: string | number | boolean = value
      if (value === 'true') parsedValue = true
      else if (value === 'false') parsedValue = false
      else if (!isNaN(Number(value)) && value.trim() !== '') parsedValue = Number(value)

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: parsedValue }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update setting')
      }

      addToast({
        variant: 'success',
        title: 'Setting Updated',
        description: 'Platform setting has been updated successfully.',
      })

      // Update local state
      if (settings) {
        setSettings({
          ...settings,
          [key]: {
            ...settings[key],
            value: parsedValue,
            updated_at: new Date().toISOString(),
          },
        })
      }

      // Remove from edited values
      const newEdited = { ...editedValues }
      delete newEdited[key]
      setEditedValues(newEdited)
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update setting',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !settings) {
    return (
      <EmptyState
        title="Failed to load settings"
        description={error}
      />
    )
  }

  if (!settings) {
    return (
      <EmptyState
        title="No settings available"
        description="Unable to load platform settings."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Manage platform-wide configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>Configure default platform behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(settings).map(([key, setting]) => {
            const displayKey = key
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            const currentValue =
              editedValues[key] !== undefined
                ? editedValues[key]
                : String(setting.value)

            return (
              <div key={key} className="space-y-2 pb-4 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor={key}>{displayKey}</Label>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {setting.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    id={key}
                    value={currentValue}
                    onChange={(e) =>
                      setEditedValues({ ...editedValues, [key]: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(key)}
                    disabled={isSaving || editedValues[key] === undefined}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

