import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserById, updateUser } from '@/lib/db/queries/users'
import type { ApiResponse } from '@/lib/types/api'
import type { User } from '@/lib/types/user'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const fullUser = await getUserById(user.id)
    if (!fullUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user without sensitive fields
    const { password_hash, ...safeUser } = fullUser

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: safeUser as User,
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch user profile. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const { full_name, email } = body

    // Validate full_name if provided
    if (full_name !== undefined) {
      if (typeof full_name !== 'string' || full_name.trim().length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Full name is required' },
          { status: 400 }
        )
      }
      if (full_name.trim().length > 100) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Full name must be 100 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate email if provided
    if (email !== undefined && email !== null) {
      if (typeof email !== 'string' || email.trim().length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Email cannot be empty' },
          { status: 400 }
        )
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: Partial<User> = {}
    if (full_name !== undefined) {
      updateData.full_name = full_name.trim()
    }
    if (email !== undefined) {
      updateData.email = email === null || email.trim() === '' ? null : email.trim()
    }

    const updatedUser = await updateUser(user.id, updateData)

    // Return user without sensitive fields
    const { password_hash, ...safeUser } = updatedUser

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: safeUser as User,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update profile. Please try again.',
      },
      { status: 500 }
    )
  }
}

