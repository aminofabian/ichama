import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'
import type { User } from '@/lib/types/user'

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
      SELECT id, full_name, phone_number, email, status, phone_verified_at, 
             email_verified_at, last_login_at, created_at, updated_at
      FROM users
      WHERE status != 'deleted'
    `
    const args: unknown[] = []

    if (search) {
      sql += ` AND (full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?)`
      const searchTerm = `%${search}%`
      args.push(searchTerm, searchTerm, searchTerm)
    }

    if (status) {
      sql += ` AND status = ?`
      args.push(status)
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    args.push(limit, offset)

    const result = await (db.execute as any)({ sql, args })

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM users WHERE status != ?'
    const countArgs: unknown[] = ['deleted']

    if (search) {
      countSql += ` AND (full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?)`
      const searchTerm = `%${search}%`
      countArgs.push(searchTerm, searchTerm, searchTerm)
    }

    if (status) {
      countSql += ` AND status = ?`
      countArgs.push(status)
    }

    const countResult = await (db.execute as any)({ sql: countSql, args: countArgs })
    const total = (countResult.rows[0]?.count as number) || 0

    // Remove password_hash from results
    const users = result.rows.map((row: any) => {
      const { ...user } = row
      return user
    }) as Omit<User, 'password_hash'>[]

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch users. Please try again.',
      },
      { status: 500 }
    )
  }
}

