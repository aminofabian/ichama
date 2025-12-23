import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getNotificationById, markNotificationAsRead } from '@/lib/db/queries/notifications'
import type { ApiResponse } from '@/lib/types/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const notification = await getNotificationById(id)
    if (!notification) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Check if user owns the notification
    if (notification.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await markNotificationAsRead(id)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notification marked as read',
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to mark notification as read. Please try again.',
      },
      { status: 500 }
    )
  }
}

