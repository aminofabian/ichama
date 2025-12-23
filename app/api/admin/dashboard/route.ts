import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    // Get total users
    const usersResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM users WHERE status != ?',
      args: ['deleted'],
    })
    const totalUsers = (usersResult.rows[0]?.count as number) || 0

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsersResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM users WHERE status = ? AND (last_login_at IS NULL OR last_login_at >= ?)',
      args: ['active', thirtyDaysAgo.toISOString()],
    })
    const activeUsers = (activeUsersResult.rows[0]?.count as number) || 0

    // Get total chamas
    const chamasResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM chamas WHERE status != ?',
      args: ['closed'],
    })
    const totalChamas = (chamasResult.rows[0]?.count as number) || 0

    // Get active cycles
    const cyclesResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM cycles WHERE status = ?',
      args: ['active'],
    })
    const activeCycles = (cyclesResult.rows[0]?.count as number) || 0

    // Get total revenue (sum of all wallet transactions of type 'fee' with direction 'in')
    const revenueResult = await db.execute({
      sql: "SELECT COALESCE(SUM(amount), 0) as total FROM wallet_transactions WHERE type = 'fee' AND direction = 'in'",
      args: [],
    })
    const totalRevenue = (revenueResult.rows[0]?.total as number) || 0

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentUsersResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM users WHERE created_at >= ?',
      args: [sevenDaysAgo.toISOString()],
    })
    const recentUsers = (recentUsersResult.rows[0]?.count as number) || 0

    // Get recent chamas (last 7 days)
    const recentChamasResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM chamas WHERE created_at >= ?',
      args: [sevenDaysAgo.toISOString()],
    })
    const recentChamas = (recentChamasResult.rows[0]?.count as number) || 0

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        recentUsers,
        totalChamas,
        recentChamas,
        activeCycles,
        totalRevenue,
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch dashboard data. Please try again.',
      },
      { status: 500 }
    )
  }
}

