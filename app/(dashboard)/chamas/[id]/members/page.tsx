'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MemberList } from '@/components/chama/member-list'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import type { Chama, ChamaMember } from '@/lib/types/chama'

interface MemberWithUser extends ChamaMember {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface MembersData {
  chama: Chama
  members: MemberWithUser[]
  isAdmin: boolean
}

export default function ChamaMembersPage() {
  const params = useParams()
  const router = useRouter()
  const chamaId = params.id as string
  const [data, setData] = useState<MembersData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch(`/api/chamas/${chamaId}/members`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch members')
        }

        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load members')
      } finally {
        setIsLoading(false)
      }
    }

    if (chamaId) {
      fetchMembers()
    }
  }, [chamaId])

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
        title="Error loading members"
        description={error || 'Could not load members.'}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/chamas/${chamaId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chama
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{data.chama.name}</h1>
        <p className="text-muted-foreground">Manage chama members</p>
      </div>

      <MemberList
        chamaId={chamaId}
        members={data.members}
        isAdmin={data.isAdmin}
      />
    </div>
  )
}

