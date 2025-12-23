'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Users, ArrowRight } from 'lucide-react'

export default function JoinPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteCode.trim()) {
      addToast({
        variant: 'error',
        title: 'Invite code required',
        description: 'Please enter a valid invite code to join a chama.',
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Validate the code by checking if the invite exists
      const response = await fetch(`/api/chamas/join/${inviteCode.trim()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid invite code')
      }

      // If valid, redirect to the invite page with the code
      router.push(`/join/${inviteCode.trim()}`)
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Invalid invite code',
        description: error instanceof Error ? error.message : 'Please check the code and try again.',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Join a Chama
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter the invite code you received to join a chama
        </p>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Enter Invite Code</CardTitle>
          <CardDescription>
            Paste or type the invite code you received from the chama admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Invite Code"
              placeholder="e.g., ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().trim())}
              disabled={isLoading}
              className="text-center text-lg font-mono tracking-wider"
              helperText="This code is usually 6-8 characters long"
            />
            <Button type="submit" className="w-full" variant="primary" disabled={isLoading || !inviteCode.trim()}>
              {isLoading ? (
                'Checking...'
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an invite code?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Create your own chama
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to homepage
        </Link>
      </div>
    </div>
  )
}

