import { NextRequest, NextResponse } from 'next/server'
import { getInvitationByCode, acceptInvitation } from '@/lib/db/queries/invitations'
import { getChamaById, getChamaByInviteCode } from '@/lib/db/queries/chamas'
import { getChamaMember, addChamaMember } from '@/lib/db/queries/chama-members'
import { getUserById } from '@/lib/db/queries/users'
import { getAuthUser } from '@/lib/auth/middleware'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // First try to find by chama invite_code (direct join)
    let chama = await getChamaByInviteCode(code)
    let invitation = null
    let inviter = null

    // If not found, try to find by invitation code
    if (!chama) {
      invitation = await getInvitationByCode(code)
      if (invitation) {
        chama = await getChamaById(invitation.chama_id)
        if (chama) {
          inviter = await getUserById(invitation.invited_by)
        }
      }
    } else {
      // If found by chama code, get the creator as inviter
      inviter = await getUserById(chama.created_by)
    }

    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Get actual member count
    const { rows } = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM chama_members WHERE chama_id = ? AND status = ?',
      args: [chama.id, 'active'],
    })
    const count = (rows[0]?.count as number) || 0

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        invitation: invitation || null,
        chama: {
          ...chama,
          memberCount: count,
        },
        inviter: inviter
          ? {
              id: inviter.id,
              full_name: inviter.full_name,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Get invite error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch invitation. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { code } = await params

    // First try to find by chama invite_code (direct join)
    let chama = await getChamaByInviteCode(code)
    let invitation = null

    // If not found, try to find by invitation code
    if (!chama) {
      invitation = await getInvitationByCode(code)
      if (invitation) {
        chama = await getChamaById(invitation.chama_id)
      }
    }

    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await getChamaMember(chama.id, user.id)
    if (existingMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are already a member of this chama' },
        { status: 400 }
      )
    }

    // Check if chama is full
    const { rows } = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM chama_members WHERE chama_id = ? AND status = ?',
      args: [chama.id, 'active'],
    })
    const memberCount = (rows[0]?.count as number) || 0

    if (memberCount >= chama.max_members) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama is full' },
        { status: 400 }
      )
    }

    // Add user to chama
    await addChamaMember(chama.id, user.id, 'member')

    // Mark invitation as accepted if it was an invitation-based join
    if (invitation) {
      await acceptInvitation(invitation.id, user.id)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chamaId: chama.id,
      },
      message: 'Successfully joined chama',
    })
  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to join chama. Please try again.',
      },
      { status: 500 }
    )
  }
}

