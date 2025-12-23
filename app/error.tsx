'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw, AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Something went wrong!</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again or contact support if the problem
            persists.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <p className="text-sm text-muted-foreground mt-4 p-4 bg-muted rounded-lg text-left">
              <strong>Error:</strong> {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" size="lg" onClick={reset}>
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          <Button variant="outline" size="lg">
            <a href="/" className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

