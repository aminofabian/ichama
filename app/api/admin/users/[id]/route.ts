import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { getUserById, updateUser } from '@/lib/db/queries/users'
import type { ApiResponse } from '@/lib/types/api'
import type { User } from '@/lib/types/user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user without password_hash
    const { password_hash, ...safeUser } = user

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: safeUser as User,
    })
  } catch (error) {
    console.error('Admin get user error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch user. Please try again.',
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
    await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const { status } = body

    if (!status || !['active', 'suspended'].includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid status. Must be "active" or "suspended"' },
        { status: 400 }
      )
    }

    const updatedUser = await updateUser(id, { status })

    // Return user without password_hash
    const { password_hash, ...safeUser } = updatedUser

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: safeUser as User,
      message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully`,
    })
  } catch (error) {
    console.error('Admin update user error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update user. Please try again.',
      },
      { status: 500 }
    )
  }
}

