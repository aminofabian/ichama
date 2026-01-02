import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserChamas, getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import db from '@/lib/db/client'
import { getUserById } from '@/lib/db/queries/users'
import { getLoanGuarantors } from '@/lib/db/queries/loans'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const userChamas = await getUserChamas(user.id)
    const adminChamas = userChamas.filter((c: any) => c.member_role === 'admin')

    if (adminChamas.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: [],
      })
    }

    const chamaIds = adminChamas.map((c: any) => c.id)
    const placeholders = chamaIds.map(() => '?').join(',')

    const result = await db.execute({
      sql: `SELECT l.* FROM loans l
            WHERE l.chama_id IN (${placeholders})
            AND l.status = 'pending'
            ORDER BY l.created_at DESC`,
      args: chamaIds,
    })

    const loans = result.rows as any[]

    const loansWithDetails = await Promise.all(
      loans.map(async (loan: any) => {
        const borrower = await getUserById(loan.user_id)
        const guarantors = await getLoanGuarantors(loan.id)
        const chama = await getChamaById(loan.chama_id)
        const defaultInterestRate = chama?.default_interest_rate || 0
        
        const guarantorDetails = await Promise.all(
          guarantors.map(async (g) => {
            const guarantorUser = await getUserById(g.guarantor_user_id)
            return {
              id: g.id,
              userId: g.guarantor_user_id,
              userName: guarantorUser?.full_name || 'Unknown',
              status: g.status,
            }
          })
        )

        return {
          loanId: loan.id,
          loanAmount: loan.amount,
          defaultInterestRate,
          borrowerName: borrower?.full_name || 'Unknown',
          borrowerPhone: borrower?.phone_number || '',
          chamaId: loan.chama_id,
          chamaName: adminChamas.find((c: any) => c.id === loan.chama_id)?.name || 'Unknown',
          guarantors: guarantorDetails,
          createdAt: loan.created_at,
        }
      })
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: loansWithDetails,
    })
  } catch (error) {
    console.error('Get pending admin loans error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending loans',
      },
      { status: 500 }
    )
  }
}

