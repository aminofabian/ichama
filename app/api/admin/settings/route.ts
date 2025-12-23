import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const result = await db.execute({
      sql: 'SELECT * FROM platform_settings ORDER BY key',
      args: [],
    })

    const settings = result.rows.reduce((acc: Record<string, any>, row: any) => {
      try {
        acc[row.key] = {
          value: JSON.parse(row.value),
          description: row.description,
          updated_at: row.updated_at,
        }
      } catch {
        acc[row.key] = {
          value: row.value,
          description: row.description,
          updated_at: row.updated_at,
        }
      }
      return acc
    }, {})

    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Admin get settings error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch settings. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()

    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Convert value to JSON string if it's not already a string
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    await db.execute({
      sql: `UPDATE platform_settings 
            SET value = ?, updated_by = ?, updated_at = ?
            WHERE key = ?`,
      args: [valueStr, admin.id, new Date().toISOString(), key],
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Setting updated successfully',
    })
  } catch (error) {
    console.error('Admin update settings error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update setting. Please try again.',
      },
      { status: 500 }
    )
  }
}

