import { getCycleById, updateCycle } from '@/lib/db/queries/cycles'
import { getCycleMembers } from '@/lib/db/queries/cycle-members'
import db from '@/lib/db/client'
import type { Cycle } from '@/lib/types/cycle'

export async function initializeCycle(cycleId: string): Promise<void> {
  const cycle = await getCycleById(cycleId)
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  const members = await getCycleMembers(cycleId)

  // Calculate end date based on frequency and total periods
  const startDate = new Date(cycle.start_date!)
  let daysToAdd = 0

  switch (cycle.frequency) {
    case 'weekly':
      daysToAdd = 7 * cycle.total_periods
      break
    case 'biweekly':
      daysToAdd = 14 * cycle.total_periods
      break
    case 'monthly':
      daysToAdd = 30 * cycle.total_periods
      break
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysToAdd)

  // Update cycle with end date
  await updateCycle(cycleId, {
    end_date: endDate.toISOString(),
  })
}

export async function startCycle(cycleId: string): Promise<void> {
  const cycle = await getCycleById(cycleId)
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  if (cycle.status !== 'pending') {
    throw new Error('Cycle can only be started if it is in pending status')
  }

  // Initialize cycle if not already done
  if (!cycle.end_date) {
    await initializeCycle(cycleId)
  }

  // Set status to active and start at period 1
  await updateCycle(cycleId, {
    status: 'active',
    current_period: 1,
  })

  // Create initial contributions for period 1
  const members = await getCycleMembers(cycleId)
  const startDate = new Date(cycle.start_date!)
  const { nanoid } = await import('nanoid')

  for (const member of members) {
    await db.execute({
      sql: `INSERT INTO contributions (
        id, cycle_id, cycle_member_id, user_id, period_number, amount_due, 
        amount_paid, due_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        cycleId,
        member.id,
        member.user_id,
        1,
        cycle.contribution_amount,
        0,
        startDate.toISOString(),
        'pending',
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    })
  }

  // Create payout for period 1 recipient
  const period1Recipient = members.find((m) => m.turn_order === 1)
  if (period1Recipient) {
    const payoutId = nanoid()
    await db.execute({
      sql: `INSERT INTO payouts (
        id, cycle_id, cycle_member_id, user_id, period_number, amount, 
        status, scheduled_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        payoutId,
        cycleId,
        period1Recipient.id,
        period1Recipient.user_id,
        1,
        cycle.payout_amount,
        'scheduled',
        startDate.toISOString(),
        new Date().toISOString(),
      ],
    })

    // Notify recipient about scheduled payout
    const { createNotification } = await import('@/lib/db/queries/notifications')
    const { formatCurrency } = await import('@/lib/utils/format')
    await createNotification({
      user_id: period1Recipient.user_id,
      type: 'payout_scheduled',
      title: `Payout Scheduled for "${cycle.name}"`,
      message: `You are scheduled to receive a payout of ${formatCurrency(cycle.payout_amount)} for period 1. The payout will be processed on ${new Date(startDate).toLocaleDateString()}.`,
      chama_id: cycle.chama_id,
      data: JSON.stringify({
        cycle_id: cycle.id,
        payout_id: payoutId,
        amount: cycle.payout_amount,
        period: 1,
      }),
    })
  }

  // Send cycle_started notifications to all members
  const { createCycleNotifications } = await import('@/lib/db/queries/notifications')
  await createCycleNotifications(cycleId, cycle.chama_id, 'cycle_started', {
    current_period: 1,
    contribution_amount: cycle.contribution_amount,
  })

  // Send WhatsApp reminders for period 1
  const { getChamaById } = await import('@/lib/db/queries/chamas')
  const { getUserById } = await import('@/lib/db/queries/users')
  const { sendContributionReminder } = await import('@/lib/services/reminder-service')
  const { recordReminderSent } = await import('@/lib/db/queries/reminders')
  const { getPeriodContributions } = await import('@/lib/db/queries/contributions')
  
  const chama = await getChamaById(cycle.chama_id)
  if (chama) {
    const period1Contributions = await getPeriodContributions(cycleId, 1)
    const dueDate = new Date(startDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    for (const contribution of period1Contributions) {
      const user = await getUserById(contribution.user_id)
      if (user) {
        try {
          await sendContributionReminder(
            user.phone_number,
            'period_started',
            {
              userName: user.full_name,
              chamaName: chama.name,
              cycleName: cycle.name,
              amountDue: contribution.amount_due,
              dueDate: contribution.due_date,
              daysUntilDue: Math.max(0, daysUntilDue),
              periodNumber: 1,
            }
          )
          await recordReminderSent(contribution.id, 'period_started')
        } catch (error) {
          console.error(`Failed to send WhatsApp reminder to ${user.phone_number}:`, error)
        }
      }
    }
  }
}

export async function advancePeriod(cycleId: string): Promise<void> {
  const cycle = await getCycleById(cycleId)
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  if (cycle.status !== 'active') {
    throw new Error('Cycle must be active to advance period')
  }

  if (cycle.current_period >= cycle.total_periods) {
    // Complete the cycle
    await updateCycle(cycleId, {
      status: 'completed',
    })

    // Send cycle_ended notifications
    const { createCycleNotifications } = await import('@/lib/db/queries/notifications')
    await createCycleNotifications(cycleId, cycle.chama_id, 'cycle_ended', {
      total_periods: cycle.total_periods,
    })
    return
  }

  const nextPeriod = cycle.current_period + 1
  const members = await getCycleMembers(cycleId)

  // Calculate due date for next period
  const startDate = new Date(cycle.start_date!)
  let daysToAdd = 0

  switch (cycle.frequency) {
    case 'weekly':
      daysToAdd = 7 * (nextPeriod - 1)
      break
    case 'biweekly':
      daysToAdd = 14 * (nextPeriod - 1)
      break
    case 'monthly':
      daysToAdd = 30 * (nextPeriod - 1)
      break
  }

  const dueDate = new Date(startDate)
  dueDate.setDate(dueDate.getDate() + daysToAdd)

  // Create contributions for next period
  const { nanoid } = await import('nanoid')
  for (const member of members) {
    // Check if member has already contributed for this period
    const existing = await db.execute({
      sql: 'SELECT id FROM contributions WHERE cycle_id = ? AND cycle_member_id = ? AND period_number = ?',
      args: [cycleId, member.id, nextPeriod],
    })

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO contributions (
          id, cycle_id, cycle_member_id, user_id, period_number, amount_due, 
          amount_paid, due_date, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          nanoid(),
          cycleId,
          member.id,
          member.user_id,
          nextPeriod,
          cycle.contribution_amount,
          0,
          dueDate.toISOString(),
          'pending',
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      })
    }
  }

  // Create payout for this period's recipient
  const periodRecipient = members.find((m) => m.turn_order === nextPeriod)
  if (periodRecipient) {
    const existingPayout = await db.execute({
      sql: 'SELECT id FROM payouts WHERE cycle_id = ? AND period_number = ?',
      args: [cycleId, nextPeriod],
    })

    if (existingPayout.rows.length === 0) {
      const payoutId = nanoid()
      await db.execute({
        sql: `INSERT INTO payouts (
          id, cycle_id, cycle_member_id, user_id, period_number, amount, 
          status, scheduled_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          payoutId,
          cycleId,
          periodRecipient.id,
          periodRecipient.user_id,
          nextPeriod,
          cycle.payout_amount,
          'scheduled',
          dueDate.toISOString(),
          new Date().toISOString(),
        ],
      })

      // Notify recipient about scheduled payout
      const { createNotification } = await import('@/lib/db/queries/notifications')
      const { formatCurrency } = await import('@/lib/utils/format')
      await createNotification({
        user_id: periodRecipient.user_id,
        type: 'payout_scheduled',
        title: `Payout Scheduled for "${cycle.name}"`,
        message: `You are scheduled to receive a payout of ${formatCurrency(cycle.payout_amount)} for period ${nextPeriod}. The payout will be processed on ${dueDate.toLocaleDateString()}.`,
        chama_id: cycle.chama_id,
        data: JSON.stringify({
          cycle_id: cycle.id,
          payout_id: payoutId,
          amount: cycle.payout_amount,
          period: nextPeriod,
        }),
      })
    }
  }

  // Update cycle to next period
  await updateCycle(cycleId, {
    current_period: nextPeriod,
  })

  // Send cycle_period_advanced notifications
  const { createCycleNotifications } = await import('@/lib/db/queries/notifications')
  await createCycleNotifications(cycleId, cycle.chama_id, 'cycle_period_advanced', {
    current_period: nextPeriod,
    contribution_amount: cycle.contribution_amount,
    payout_recipient: periodRecipient?.user_id,
  })

  // Send WhatsApp reminders for new period
  const { getChamaById } = await import('@/lib/db/queries/chamas')
  const { getUserById } = await import('@/lib/db/queries/users')
  const { sendContributionReminder } = await import('@/lib/services/reminder-service')
  const { recordReminderSent } = await import('@/lib/db/queries/reminders')
  const { getPeriodContributions } = await import('@/lib/db/queries/contributions')
  
  const chama = await getChamaById(cycle.chama_id)
  if (chama) {
    const periodContributions = await getPeriodContributions(cycleId, nextPeriod)
    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    for (const contribution of periodContributions) {
      const user = await getUserById(contribution.user_id)
      if (user) {
        try {
          await sendContributionReminder(
            user.phone_number,
            'period_started',
            {
              userName: user.full_name,
              chamaName: chama.name,
              cycleName: cycle.name,
              amountDue: contribution.amount_due,
              dueDate: contribution.due_date,
              daysUntilDue: Math.max(0, daysUntilDue),
              periodNumber: nextPeriod,
            }
          )
          await recordReminderSent(contribution.id, 'period_started')
        } catch (error) {
          console.error(`Failed to send WhatsApp reminder to ${user.phone_number}:`, error)
        }
      }
    }
  }
}

