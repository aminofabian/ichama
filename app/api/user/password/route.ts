import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserById, updateUser } from '@/lib/db/queries/users'
import { compare, hash } from 'bcryptjs'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const { current_password, new_password, confirm_password } = body

    if (!current_password || !new_password || !confirm_password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'All password fields are required' },
        { status: 400 }
      )
    }

    if (new_password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (new_password !== confirm_password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'New password and confirmation do not match' },
        { status: 400 }
      )
    }

    if (current_password === new_password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'New password must be different from current password' },
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

    // Verify current password
    const isCurrentPasswordValid = await compare(current_password, fullUser.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await hash(new_password, 10)

    // Update password
    await updateUser(user.id, {
      password_hash: newPasswordHash,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to change password. Please try again.',
      },
      { status: 500 }
    )
  }
}

