import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember, getChamaMembers, addChamaMember } from '@/lib/db/queries/chama-members'
import { getUserById } from '@/lib/db/queries/users'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
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

    const currentMember = await getChamaMember(id, user.id)
    if (!currentMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    const members = await getChamaMembers(id)

    // Fetch user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const memberUser = await getUserById(member.user_id)
        return {
          ...member,
          user: memberUser
            ? {
                id: memberUser.id,
                full_name: memberUser.full_name,
                phone_number: memberUser.phone_number,
              }
            : undefined,
        }
      })
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chama,
        members: membersWithUsers,
        isAdmin: currentMember.role === 'admin',
      },
    })
  } catch (error) {
    console.error('Get members error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch members. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { userId, role = 'member' } = body

    const chama = await getChamaById(id)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const currentMember = await getChamaMember(id, user.id)
    if (!currentMember || currentMember.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins can add members' },
        { status: 403 }
      )
    }

    const existingMember = await getChamaMember(id, userId)
    if (existingMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already a member' },
        { status: 400 }
      )
    }

    const newMember = await addChamaMember(id, userId, role)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: newMember,
    })
  } catch (error) {
    console.error('Add member error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to add member. Please try again.',
      },
      { status: 500 }
    )
  }
}
