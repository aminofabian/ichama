import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember, removeChamaMember } from '@/lib/db/queries/chama-members'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id, memberId } = await params

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
        { success: false, error: 'Only admins can remove members' },
        { status: 403 }
      )
    }

    // Get the member to be removed
    const result = await db.execute({
      sql: 'SELECT * FROM chama_members WHERE id = ? AND chama_id = ?',
      args: [memberId, id],
    })

    if (result.rows.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    const memberToRemove = result.rows[0] as { role: string; user_id: string }

    // Prevent removing yourself
    if (memberToRemove.user_id === user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You cannot remove yourself' },
        { status: 400 }
      )
    }

    // Prevent removing other admins
    if (memberToRemove.role === 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot remove other admins' },
        { status: 400 }
      )
    }

    await removeChamaMember(memberId)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error) {
    console.error('Remove member error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to remove member. Please try again.',
      },
      { status: 500 }
    )
  }
}

