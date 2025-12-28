import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import {
  getAllReminderSettings,
  updateReminderSetting,
} from '@/lib/db/queries/reminder-templates'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const settings = await getAllReminderSettings()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settings },
    })
  } catch (error) {
    console.error('Get reminder settings error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: `Failed to fetch reminder settings: ${errorMessage}`,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()

    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'settings object is required' },
        { status: 400 }
      )
    }

    for (const [key, value] of Object.entries(settings)) {
      await updateReminderSetting(key, String(value))
    }

    const updatedSettings = await getAllReminderSettings()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settings: updatedSettings },
      message: 'Reminder settings updated successfully',
    })
  } catch (error) {
    console.error('Update reminder settings error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update reminder settings',
      },
      { status: 500 }
    )
  }
}

