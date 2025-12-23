import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserById, updateUser } from '@/lib/db/queries/users'
import { deleteUserSessions } from '@/lib/db/queries/sessions'
import { compare } from 'bcryptjs'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const { password } = body

    if (!password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password is required to delete account' },
        { status: 400 }
      )
    }

    // Get user with password hash
    const fullUser = await getUserById(user.id)
    if (!fullUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const isPasswordValid = await compare(password, fullUser.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Soft delete: set status to 'deleted'
    await updateUser(user.id, {
      status: 'deleted',
    })

    // Delete all user sessions (logout from all devices)
    await deleteUserSessions(user.id)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete account. Please try again.',
      },
      { status: 500 }
    )
  }
}

