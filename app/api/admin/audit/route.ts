import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const actorId = searchParams.get('actor_id') || ''
    const action = searchParams.get('action') || ''
    const entityType = searchParams.get('entity_type') || ''
    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    let sql = 'SELECT * FROM audit_logs WHERE 1=1'
    const args: unknown[] = []

    if (actorId) {
      sql += ' AND actor_id = ?'
      args.push(actorId)
    }

    if (action) {
      sql += ' AND action LIKE ?'
      args.push(`%${action}%`)
    }

    if (entityType) {
      sql += ' AND entity_type = ?'
      args.push(entityType)
    }

    if (startDate) {
      sql += ' AND created_at >= ?'
      args.push(startDate)
    }

    if (endDate) {
      sql += ' AND created_at <= ?'
      args.push(endDate)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(limit, offset)

    const result = await (db.execute as any)({ sql, args })

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1'
    const countArgs: unknown[] = []

    if (actorId) {
      countSql += ' AND actor_id = ?'
      countArgs.push(actorId)
    }

    if (action) {
      countSql += ' AND action LIKE ?'
      countArgs.push(`%${action}%`)
    }

    if (entityType) {
      countSql += ' AND entity_type = ?'
      countArgs.push(entityType)
    }

    if (startDate) {
      countSql += ' AND created_at >= ?'
      countArgs.push(startDate)
    }

    if (endDate) {
      countSql += ' AND created_at <= ?'
      countArgs.push(endDate)
    }

    const countResult = await (db.execute as any)({ sql: countSql, args: countArgs })
    const total = (countResult.rows[0]?.count as number) || 0

    const logs = result.rows

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Admin audit logs error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch audit logs. Please try again.',
      },
      { status: 500 }
    )
  }
}

