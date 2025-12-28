import { NextRequest, NextResponse } from 'next/server'
import { getContributionsNeedingReminders } from '@/lib/db/queries/reminders'
import { hasReminderBeenSent, recordReminderSent } from '@/lib/db/queries/reminders'
import { sendContributionReminder, type ReminderType } from '@/lib/services/reminder-service'
import { isReminderTypeEnabled } from '@/lib/db/queries/reminder-templates'
import type { ApiResponse } from '@/lib/types/api'

const CRON_SECRET = process.env.CRON_SECRET

function getReminderType(daysUntilDue: number): ReminderType | null {
  if (daysUntilDue === 7) {
    return 'period_started'
  }
  if (daysUntilDue === 3) {
    return 'three_days_before'
  }
  if (daysUntilDue === 1) {
    return 'one_day_before'
  }
  if (daysUntilDue === 0) {
    return 'due_date'
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.nextUrl.searchParams.get('secret')

    if (CRON_SECRET && cronSecret !== CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { areRemindersEnabled } = await import('@/lib/db/queries/reminder-templates')
    const remindersEnabled = await areRemindersEnabled()
    
    if (!remindersEnabled) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          processed: 0,
          sent: 0,
          skipped: 0,
          errors: 0,
          details: [],
        },
        message: 'Reminders are disabled globally',
      })
    }

    const contributions = await getContributionsNeedingReminders()
    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        contribution_id: string
        reminder_type: string
        status: 'sent' | 'skipped' | 'error'
        reason?: string
      }>,
    }

    for (const contribution of contributions) {
      const reminderType = getReminderType(contribution.days_until_due)

      if (!reminderType) {
        continue
      }

      results.processed++

      const typeEnabled = await isReminderTypeEnabled(reminderType)
      if (!typeEnabled) {
        results.skipped++
        results.details.push({
          contribution_id: contribution.contribution_id,
          reminder_type: reminderType,
          status: 'skipped',
          reason: 'Reminder type disabled',
        })
        continue
      }

      const alreadySent = await hasReminderBeenSent(
        contribution.contribution_id,
        reminderType
      )

      if (alreadySent) {
        results.skipped++
        results.details.push({
          contribution_id: contribution.contribution_id,
          reminder_type: reminderType,
          status: 'skipped',
          reason: 'Already sent',
        })
        continue
      }

      try {
        const sent = await sendContributionReminder(
          contribution.user_phone,
          reminderType,
          {
            userName: contribution.user_name,
            chamaName: contribution.chama_name,
            cycleName: contribution.cycle_name,
            amountDue: contribution.amount_due,
            dueDate: contribution.due_date,
            daysUntilDue: contribution.days_until_due,
            periodNumber: contribution.period_number,
          }
        )

        if (sent) {
          await recordReminderSent(contribution.contribution_id, reminderType)
          results.sent++
          results.details.push({
            contribution_id: contribution.contribution_id,
            reminder_type: reminderType,
            status: 'sent',
          })
        } else {
          results.errors++
          results.details.push({
            contribution_id: contribution.contribution_id,
            reminder_type: reminderType,
            status: 'error',
            reason: 'Failed to send WhatsApp message',
          })
        }
      } catch (error) {
        results.errors++
        results.details.push({
          contribution_id: contribution.contribution_id,
          reminder_type: reminderType,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error',
        })
        console.error(`Error sending reminder for contribution ${contribution.contribution_id}:`, error)
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: results,
      message: `Processed ${results.processed} contributions. Sent ${results.sent}, skipped ${results.skipped}, errors ${results.errors}`,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process reminders',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

