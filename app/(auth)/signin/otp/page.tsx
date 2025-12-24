'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

function OTPForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const inviteCode = searchParams.get('invite')
  const phoneNumber = searchParams.get('phone') || ''
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit code' })
      return
    }

    setIsLoading(true)

    try {
      const verifyResponse = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode, purpose: 'login' }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Failed to verify OTP')
      }

      const signinResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otpToken: verifyData.data.otpToken }),
      })

      const signinData = await signinResponse.json()

      if (!signinResponse.ok || !signinData.success) {
        throw new Error(signinData.error || 'Failed to sign in')
      }

      addToast({
        variant: 'success',
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      })

      if (inviteCode) {
        try {
          const joinResponse = await fetch(`/api/chamas/join/${inviteCode}`, {
            method: 'POST',
          })

          const joinResult = await joinResponse.json()

          if (joinResponse.ok && joinResult.success) {
            addToast({
              variant: 'success',
              title: 'Welcome to the chama!',
              description: 'You have successfully joined.',
            })
            router.push(`/chamas/${joinResult.data.chamaId}`)
          } else {
            router.push('/dashboard')
          }
        } catch {
          router.push('/dashboard')
        }
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, purpose: 'login', deliveryMethod: 'sms' }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      addToast({
        variant: 'success',
        title: 'OTP Sent',
        description: 'Check your SMS for the verification code.',
      })
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Failed to send OTP',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 md:items-center md:justify-center md:px-0">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Verify OTP</h1>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-3xl font-bold">Enter verification code</h2>
          <p className="text-muted-foreground">
            We sent a 6-digit code to {phoneNumber}
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setOtpCode(value)
                setErrors({})
              }}
              error={errors.otp}
              disabled={isLoading}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FFD700] text-foreground hover:bg-[#FFD700]/90"
            disabled={isLoading || otpCode.length !== 6}
            size="lg"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Verifying...</span>
              </>
            ) : (
              'Verify'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OTPPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <OTPForm />
    </Suspense>
  )
}

