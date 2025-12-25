'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { Avatar } from '@/components/ui/avatar'
import { User, Save, X } from 'lucide-react'
import type { User as UserType } from '@/lib/types/user'

interface ProfileFormProps {
  user: UserType
  onUpdate?: (user: UserType) => void
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const { addToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }

      addToast({
        variant: 'success',
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      })

      setIsEditing(false)
      if (onUpdate) {
        onUpdate(result.data)
      }
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: user.full_name,
      email: user.email || '',
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </div>
          {!isEditing && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b">
            <Avatar name={user.full_name} size="lg" />
            <div>
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.phone_number}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing || isLoading}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={user.phone_number}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Phone number cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing || isLoading}
                placeholder="Enter your email address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll use this to send important updates and notifications.
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isLoading}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

