import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getContributionById } from '@/lib/db/queries/contributions'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMembers } from '@/lib/db/queries/chama-members'
import { getUserById } from '@/lib/db/queries/users'
import { createNotification } from '@/lib/db/queries/notifications'
import { sendSMS } from '@/lib/auth/sms'
import { formatCurrency } from '@/lib/utils/format'
import { normalizePhone } from '@/lib/utils/phone'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Get contribution
    const contribution = await getContributionById(id)
    if (!contribution) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      )
    }

    // Verify the contribution belongs to the user
    if (contribution.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get cycle and chama info
    const cycle = await getCycleById(contribution.cycle_id)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    const chama = await getChamaById(cycle.chama_id)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    // Get all admins of the chama
    const members = await getChamaMembers(chama.id)
    const admins = members.filter((m) => m.role === 'admin' && m.status === 'active')

    if (admins.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No admins found for this chama' },
        { status: 404 }
      )
    }

    // Get admin user details including phone numbers
    const adminUsers = await Promise.all(
      admins.map(async (admin) => {
        const adminUser = await getUserById(admin.user_id)
        return {
          ...admin,
          user: adminUser,
        }
      })
    )

    const reminderMessage = `${user.full_name || 'A member'} has paid ${formatCurrency(contribution.amount_paid)} for period ${contribution.period_number} in "${cycle.name}" and is waiting for confirmation. Please confirm the payment in the app.`

    // Send SMS and notifications to all admins
    let smsSent = 0
    let notificationsSent = 0

    for (const admin of adminUsers) {
      // Send in-app notification
      try {
        await createNotification({
          user_id: admin.user_id,
          type: 'contribution_reminder',
          title: 'Payment Confirmation Reminder',
          message: reminderMessage,
          data: JSON.stringify({
            contribution_id: contribution.id,
            cycle_id: cycle.id,
            chama_id: chama.id,
            period_number: contribution.period_number,
            amount_paid: contribution.amount_paid,
            requested_by: user.id,
          }),
          chama_id: chama.id,
        })
        notificationsSent++
      } catch (error) {
        console.error(`Failed to send notification to admin ${admin.user_id}:`, error)
      }

      // Send SMS if admin has a phone number
      if (admin.user?.phone_number) {
        try {
          const normalizedPhone = normalizePhone(admin.user.phone_number)
          const smsSuccess = await sendSMS(normalizedPhone, reminderMessage)
          if (smsSuccess) {
            smsSent++
          } else {
            console.warn(`SMS failed for admin ${admin.user.phone_number}, but notification was sent`)
          }
        } catch (error) {
          console.error(`Failed to send SMS to admin ${admin.user.phone_number}:`, error)
          // Continue with other admins even if one SMS fails
        }
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: `Reminder sent to ${admins.length} admin${admins.length !== 1 ? 's' : ''}`,
        adminsNotified: admins.length,
        smsSent,
        notificationsSent,
      },
    })
  } catch (error) {
    console.error('Send reminder error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send reminder'
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

