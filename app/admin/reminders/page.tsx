'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/components/ui/toast'
import { Bell, Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import type { ReminderType } from '@/lib/services/reminder-service'

interface ReminderTemplate {
  id: string
  reminder_type: ReminderType
  template_text: string
  is_active: number
  created_at: string
  updated_at: string
}

interface ReminderSetting {
  id: string
  setting_key: string
  setting_value: string
  description: string | null
}

const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  period_started: 'Period Started (7 days before)',
  three_days_before: '3 Days Before',
  one_day_before: '1 Day Before',
  due_date: 'Due Date (Today)',
}

const TEMPLATE_VARIABLES = [
  { var: '{{userName}}', desc: 'User\'s full name' },
  { var: '{{chamaName}}', desc: 'Chama name' },
  { var: '{{cycleName}}', desc: 'Cycle name' },
  { var: '{{amount}}', desc: 'Formatted contribution amount (KES)' },
  { var: '{{dueDate}}', desc: 'Formatted due date' },
  { var: '{{daysUntilDue}}', desc: 'Number of days until due date' },
  { var: '{{periodNumber}}', desc: 'Current period number' },
]

export default function AdminRemindersPage() {
  const { addToast } = useToast()
  const [templates, setTemplates] = useState<ReminderTemplate[]>([])
  const [settings, setSettings] = useState<ReminderSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Record<string, string>>({})
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [templatesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/reminders/templates'),
        fetch('/api/admin/reminders/settings'),
      ])

      const templatesResult = await templatesRes.json()
      const settingsResult = await settingsRes.json()

      const errors: string[] = []

      if (!templatesRes.ok || !templatesResult.success) {
        const errMsg = templatesResult.error || 'Failed to fetch templates'
        console.error('Templates API error:', errMsg)
        errors.push(errMsg)
        setTemplates([])
      } else {
        setTemplates(templatesResult.data.templates || [])
      }

      if (!settingsRes.ok || !settingsResult.success) {
        const errMsg = settingsResult.error || 'Failed to fetch settings'
        console.error('Settings API error:', errMsg)
        errors.push(errMsg)
        setSettings([])
      } else {
        setSettings(settingsResult.data.settings || [])
      }

      if (errors.length > 0) {
        setError(errors.join('; '))
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reminders')
      setTemplates([])
      setSettings([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTemplate = async (reminderType: ReminderType) => {
    setIsSaving(true)
    try {
      const templateText = editingTemplate[reminderType]
      if (!templateText) return

      const template = templates.find((t) => t.reminder_type === reminderType)
      const isActive = template?.is_active ?? 1

      const response = await fetch('/api/admin/reminders/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_type: reminderType,
          template_text: templateText,
          is_active: isActive,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update template')
      }

      addToast({
        variant: 'success',
        title: 'Template Updated',
        description: 'Reminder template has been updated successfully.',
      })

      await fetchData()
      const newEditing = { ...editingTemplate }
      delete newEditing[reminderType]
      setEditingTemplate(newEditing)
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update template',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleTemplate = async (reminderType: ReminderType, isActive: boolean) => {
    setIsSaving(true)
    try {
      const template = templates.find((t) => t.reminder_type === reminderType)
      if (!template) return

      const response = await fetch('/api/admin/reminders/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_type: reminderType,
          template_text: template.template_text,
          is_active: isActive ? 1 : 0,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update template')
      }

      await fetchData()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update template',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const settingsObj: Record<string, string> = {}
      settings.forEach((setting) => {
        settingsObj[setting.setting_key] = setting.setting_value
      })

      const response = await fetch('/api/admin/reminders/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsObj }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update settings')
      }

      addToast({
        variant: 'success',
        title: 'Settings Updated',
        description: 'Reminder settings have been updated successfully.',
      })

      await fetchData()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.setting_key === key ? { ...s, setting_value: value } : s))
    )
  }

  const showPreview = (reminderType: ReminderType) => {
    const template = templates.find((t) => t.reminder_type === reminderType)
    const templateText = editingTemplate[reminderType] ?? template?.template_text ?? ''
    
    if (!templateText) {
      addToast({
        variant: 'error',
        title: 'No Template',
        description: 'Please add template text first',
      })
      return
    }
    
    const preview = templateText
      .replace(/\{\{userName\}\}/g, 'John Doe')
      .replace(/\{\{chamaName\}\}/g, 'Family Savings')
      .replace(/\{\{cycleName\}\}/g, 'Monthly Contributions 2024')
      .replace(/\{\{amount\}\}/g, 'KES 10,000')
      .replace(/\{\{dueDate\}\}/g, 'February 20, 2024')
      .replace(/\{\{daysUntilDue\}\}/g, '7')
      .replace(/\{\{periodNumber\}\}/g, '1')

    setPreviewTemplate(preview)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && templates.length === 0 && settings.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Reminders</h1>
          <p className="text-muted-foreground mt-1">
            Manage contribution reminder messages and settings
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="Setup Required"
              description={
                error.includes('no such table') || error.includes('does not exist') || error.includes('Failed to fetch')
                  ? 'Please run the database migration first: bun run db:migrate'
                  : `Error: ${error}`
              }
            />
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">To fix this:</p>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Open your terminal</li>
                <li>Run: <code className="bg-background px-2 py-1 rounded">bun run db:migrate</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const remindersEnabled = settings.find((s) => s.setting_key === 'reminders_enabled')?.setting_value === '1'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp Reminders</h1>
        <p className="text-muted-foreground mt-1">
          Manage contribution reminder messages and settings
        </p>
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> {error}
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Settings
          </CardTitle>
          <CardDescription>Enable or disable reminder types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No settings found. Please run the database migration.</p>
            </div>
          ) : (
            settings.map((setting) => {
            const isToggle = setting.setting_key !== 'reminders_enabled' && 
              setting.setting_key.startsWith('send_')
            const displayName = setting.setting_key
              .replace('send_', '')
              .replace('_', ' ')
              .split(' ')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')

            return (
              <div key={setting.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1">
                  <Label className="text-base font-medium">
                    {setting.setting_key === 'reminders_enabled'
                      ? 'Enable All Reminders'
                      : `Send ${displayName} Reminders`}
                  </Label>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                  )}
                </div>
                <Switch
                  checked={setting.setting_value === '1'}
                  onCheckedChange={(checked) =>
                    handleSettingChange(setting.setting_key, checked ? '1' : '0')
                  }
                  disabled={!remindersEnabled && setting.setting_key !== 'reminders_enabled'}
                />
              </div>
            )
          }))}
          {settings.length > 0 && (
          <div className="pt-4">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder Templates</CardTitle>
          <CardDescription>
            Customize the WhatsApp messages sent to users. Use variables like{' '}
            {TEMPLATE_VARIABLES.slice(0, 3).map((v) => v.var).join(', ')}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {templates.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No templates found. Please run the database migration.</p>
            </div>
          ) : (
            (['period_started', 'three_days_before', 'one_day_before', 'due_date'] as ReminderType[]).map((type) => {
            const template = templates.find((t) => t.reminder_type === type)
            const currentText = editingTemplate[type] ?? template?.template_text ?? ''
            const isEditing = editingTemplate[type] !== undefined
            const hasChanges = isEditing && editingTemplate[type] !== template?.template_text

            return (
              <div key={type} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label className="text-base font-semibold">
                      {REMINDER_TYPE_LABELS[type]}
                    </Label>
                    <Switch
                      checked={template?.is_active === 1}
                      onCheckedChange={(checked) => handleToggleTemplate(type, checked)}
                      disabled={isSaving}
                    />
                    <span className="text-xs text-muted-foreground">
                      {template?.is_active === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showPreview(type)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`template-${type}`} className="text-sm">
                    Template Text
                  </Label>
                  <textarea
                    id={`template-${type}`}
                    value={currentText}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, [type]: e.target.value })
                    }
                    className="w-full min-h-[120px] p-3 border rounded-md font-mono text-sm"
                    placeholder="Enter template text..."
                  />
                </div>

                {hasChanges && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveTemplate(type)}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEditing = { ...editingTemplate }
                        delete newEditing[type]
                        setEditingTemplate(newEditing)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )
          }))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
          <CardDescription>
            Use these variables in your templates. They will be replaced with actual values when sending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATE_VARIABLES.map((variable) => (
              <div key={variable.var} className="flex items-start gap-2 p-2 bg-muted rounded">
                <code className="text-sm font-mono font-semibold">{variable.var}</code>
                <span className="text-sm text-muted-foreground">{variable.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {previewTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Message Preview</CardTitle>
            <CardDescription>How the message will appear to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap font-sans">
              {previewTemplate}
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setPreviewTemplate(null)}
            >
              Close Preview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

