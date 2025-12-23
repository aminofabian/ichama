import { getPayoutById, updatePayout } from '@/lib/db/queries/payouts'
import { getCycleById } from '@/lib/db/queries/cycles'
import { createWalletTransaction } from '@/lib/db/queries/wallet'
import { createNotification } from '@/lib/db/queries/notifications'
import { formatCurrency } from '@/lib/utils/format'
import type { Payout } from '@/lib/types/contribution'

export async function processPayout(
  payoutId: string,
  adminId: string
): Promise<Payout> {
  const payout = await getPayoutById(payoutId)
  if (!payout) {
    throw new Error('Payout not found')
  }

  if (payout.status === 'paid' || payout.status === 'confirmed') {
    throw new Error('Payout has already been processed')
  }

  const updatedPayout = await updatePayout(payoutId, {
    status: 'paid',
    paid_at: new Date().toISOString(),
    paid_by: adminId,
  })

  // Create wallet transaction for the payout
  const cycle = await getCycleById(payout.cycle_id)
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  await createWalletTransaction({
    user_id: payout.user_id,
    chama_id: cycle.chama_id,
    cycle_id: cycle.id,
    type: 'payout',
    amount: payout.amount,
    direction: 'in',
    reference_type: 'payout',
    reference_id: payout.id,
    description: `Payout for cycle "${cycle.name}", period ${payout.period_number}`,
  })

  // Send notification to recipient
  await createNotification({
    user_id: payout.user_id,
    type: 'payout_sent',
    title: `Payout Sent for "${cycle.name}"`,
    message: `Your payout of ${formatCurrency(payout.amount)} for period ${payout.period_number} has been sent. Please confirm receipt when you receive it.`,
    chama_id: cycle.chama_id,
    data: JSON.stringify({
      cycle_id: cycle.id,
      payout_id: payout.id,
      amount: payout.amount,
      period: payout.period_number,
    }),
  })

  return updatedPayout
}

export async function confirmPayoutReceipt(
  payoutId: string,
  userId: string
): Promise<Payout> {
  const payout = await getPayoutById(payoutId)
  if (!payout) {
    throw new Error('Payout not found')
  }

  if (payout.user_id !== userId) {
    throw new Error('You can only confirm your own payouts')
  }

  if (payout.status !== 'paid') {
    throw new Error('Payout must be marked as paid before confirmation')
  }

  if (payout.confirmed_by_member === 1) {
    throw new Error('Payout has already been confirmed')
  }

  const updatedPayout = await updatePayout(payoutId, {
    status: 'confirmed',
    confirmed_by_member: 1,
    confirmed_at: new Date().toISOString(),
  })

  // Send notification to admin
  const cycle = await getCycleById(payout.cycle_id)
  if (cycle) {
    // Get cycle admins
    const { getChamaMembers } = await import('@/lib/db/queries/chama-members')
    const members = await getChamaMembers(cycle.chama_id)
    const admins = members.filter((m) => m.role === 'admin')

    for (const admin of admins) {
      await createNotification({
        user_id: admin.user_id,
        type: 'payout_received',
        title: `Payout Confirmed for "${cycle.name}"`,
        message: `Payout of ${formatCurrency(payout.amount)} for period ${payout.period_number} has been confirmed by the recipient.`,
        chama_id: cycle.chama_id,
        data: JSON.stringify({
          cycle_id: cycle.id,
          payout_id: payout.id,
          amount: payout.amount,
          period: payout.period_number,
        }),
      })
    }
  }

  return updatedPayout
}

