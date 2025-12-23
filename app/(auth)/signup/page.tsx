'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

type Step = 'phone' | 'otp' | 'details'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const inviteCode = searchParams.get('invite')
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!phoneNumber) {
      setErrors({ phone: 'Phone number is required' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, purpose: 'signup' }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      addToast({
        variant: 'success',
        title: 'OTP Sent',
        description: 'Check your phone for the verification code.',
      })

      setStep('otp')
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit code' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode, purpose: 'signup' }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify OTP')
      }

      setOtpToken(data.data.otpToken)
      setStep('details')
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          password,
          otpToken,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account')
      }

      addToast({
        variant: 'success',
        title: 'Account created!',
        description: 'Welcome to Merry. Let\'s get started!',
      })

      // If there's an invite code, join the chama automatically
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
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          {step === 'phone' && 'Enter your phone number to get started'}
          {step === 'otp' && 'Enter the verification code sent to your phone'}
          {step === 'details' && 'Complete your profile'}
        </CardDescription>
      </CardHeader>

      {step === 'phone' && (
        <form onSubmit={handleSendOTP}>
          <CardContent className="space-y-4">
            <Input
              type="tel"
              label="Phone Number"
              placeholder="0712 345 678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={errors.phone}
              disabled={isLoading}
              helperText="We'll send you a verification code"
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Sending...</span>
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP}>
          <CardContent className="space-y-4">
            <Input
              type="text"
              label="Verification Code"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              error={errors.otp}
              disabled={isLoading}
              maxLength={6}
            />
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Change phone number
            </button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Verifying...</span>
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
            <button
              type="button"
              onClick={handleSendOTP}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              Resend code
            </button>
          </CardFooter>
        </form>
      )}

      {step === 'details' && (
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              placeholder="John Kamau"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.name}
              disabled={isLoading}
            />
            <Input
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isLoading}
            />
            <Input
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Enter your phone number to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    }>
      <SignUpForm />
    </Suspense>
  )
}

