import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getChamaById, updateChama } from '@/lib/db/queries/chamas'
import { getChamaMember, getChamaMembers } from '@/lib/db/queries/chama-members'
import { getUserById } from '@/lib/db/queries/users'
import { getActiveCycle } from '@/lib/db/queries/cycles'
import { getCycleMembers } from '@/lib/db/queries/cycle-members'
import db from '@/lib/db/client'
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

    const member = await getChamaMember(id, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    // Fetch all members with user details
    const members = await getChamaMembers(id)
    const membersWithUsers = await Promise.all(
      members.map(async (m) => {
        const memberUser = await getUserById(m.user_id)
        return {
          ...m,
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

    // Get active cycle if any
    let activeCycle = await getActiveCycle(id)
    let cycleMember = null
    if (activeCycle) {
      const cycleMembers = await getCycleMembers(activeCycle.id)
      cycleMember = cycleMembers.find((cm) => cm.user_id === user.id) || null
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chama,
        member,
        members: membersWithUsers,
        isAdmin: member.role === 'admin',
        activeCycle: activeCycle || null,
        cycleMember: cycleMember || null,
      },
    })
  } catch (error) {
    console.error('Get chama error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch chama. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

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
        { success: false, error: 'Only admins can update chama settings' },
        { status: 403 }
      )
    }

    const { name, description, is_private } = body
    const updatedChama = await updateChama(id, {
      name,
      description,
      is_private,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedChama,
    })
  } catch (error) {
    console.error('Update chama error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update chama. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { success: false, error: 'Only admins can delete chamas' },
        { status: 403 }
      )
    }

    // Delete all related data
    await db.execute({ sql: 'DELETE FROM chama_members WHERE chama_id = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM cycles WHERE chama_id = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM invitations WHERE chama_id = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM join_requests WHERE chama_id = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM chamas WHERE id = ?', args: [id] })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Chama deleted successfully',
    })
  } catch (error) {
    console.error('Delete chama error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete chama. Please try again.',
      },
      { status: 500 }
    )
  }
}

