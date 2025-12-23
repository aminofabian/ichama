import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'
import type { Chama } from '@/lib/types/chama'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    let sql = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM chama_members WHERE chama_id = c.id AND status = 'active') as member_count,
             (SELECT COUNT(*) FROM cycles WHERE chama_id = c.id) as cycle_count,
             (SELECT COUNT(*) FROM cycles WHERE chama_id = c.id AND status = 'active') as active_cycles
      FROM chamas c
      WHERE c.status != 'closed'
    `
    const args: unknown[] = []

    if (search) {
      sql += ` AND (c.name LIKE ? OR c.description LIKE ?)`
      const searchTerm = `%${search}%`
      args.push(searchTerm, searchTerm)
    }

    if (status) {
      sql += ` AND c.status = ?`
      args.push(status)
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
    args.push(limit, offset)

    const result = await (db.execute as any)({ sql, args })

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM chamas WHERE status != ?'
    const countArgs: unknown[] = ['closed']

    if (search) {
      countSql += ` AND (name LIKE ? OR description LIKE ?)`
      const searchTerm = `%${search}%`
      countArgs.push(searchTerm, searchTerm)
    }

    if (status) {
      countSql += ` AND status = ?`
      countArgs.push(status)
    }

    const countResult = await (db.execute as any)({ sql: countSql, args: countArgs })
    const total = (countResult.rows[0]?.count as number) || 0

    const chamas = result.rows.map((row: any) => ({
      ...row,
      member_count: row.member_count || 0,
      cycle_count: row.cycle_count || 0,
      active_cycles: row.active_cycles || 0,
    })) as (Chama & { member_count: number; cycle_count: number; active_cycles: number })[]

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chamas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Admin chamas list error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch chamas. Please try again.',
      },
      { status: 500 }
    )
  }
}

