import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { createInvitation } from '@/lib/db/queries/invitations'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const chama = await getChamaById(id)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(id, user.id)
    if (!member || member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins can create invitations' },
        { status: 403 }
      )
    }

    // Create invitation that expires in 30 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const invitation = await createInvitation(id, user.id, expiresAt.toISOString())

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${invitation.invite_code}`

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        invitation,
        inviteLink,
      },
    })
  } catch (error) {
    console.error('Create invite error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create invitation. Please try again.',
      },
      { status: 500 }
    )
  }
}

