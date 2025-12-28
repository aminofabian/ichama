import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import {
  getAllReminderTemplates,
  createOrUpdateReminderTemplate,
  deleteReminderTemplate,
} from '@/lib/db/queries/reminder-templates'
import type { ApiResponse } from '@/lib/types/api'
import type { ReminderType } from '@/lib/services/reminder-service'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const templates = await getAllReminderTemplates()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { templates },
    })
  } catch (error) {
    console.error('Get reminder templates error:', error)
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
        error: `Failed to fetch reminder templates: ${errorMessage}`,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()

    const { reminder_type, template_text, is_active } = body

    if (!reminder_type || !template_text) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'reminder_type and template_text are required' },
        { status: 400 }
      )
    }

    const validTypes: ReminderType[] = [
      'period_started',
      'three_days_before',
      'one_day_before',
      'due_date',
    ]
    if (!validTypes.includes(reminder_type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid reminder_type' },
        { status: 400 }
      )
    }

    const template = await createOrUpdateReminderTemplate({
      reminder_type,
      template_text,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
      created_by: admin.id,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { template },
      message: 'Reminder template updated successfully',
    })
  } catch (error) {
    console.error('Create/update reminder template error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create/update reminder template',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const reminderType = searchParams.get('reminder_type') as ReminderType

    if (!reminderType) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'reminder_type is required' },
        { status: 400 }
      )
    }

    await deleteReminderTemplate(reminderType)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Reminder template deleted successfully',
    })
  } catch (error) {
    console.error('Delete reminder template error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete reminder template',
      },
      { status: 500 }
    )
  }
}

