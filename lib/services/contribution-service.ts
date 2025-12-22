import { getContributionById, updateContribution } from '@/lib/db/queries/contributions'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getSavingsAccount, updateSavingsBalance, createSavingsTransaction } from '@/lib/db/queries/savings'
import { createWalletTransaction } from '@/lib/db/queries/wallet'
import { createNotification } from '@/lib/db/queries/notifications'
import type { Contribution } from '@/lib/types/contribution'

export async function recordContribution(
  contributionId: string,
  data: {
    amount_paid: number
    paid_at?: string
    notes?: string
  }
): Promise<Contribution> {
  const contribution = await getContributionById(contributionId)
  if (!contribution) {
    throw new Error('Contribution not found')
  }

  // Determine status based on amount paid
  let status: Contribution['status'] = 'pending'
  if (data.amount_paid >= contribution.amount_due) {
    status = 'paid'
  } else if (data.amount_paid > 0) {
    status = 'partial'
  }

  const updatedContribution = await updateContribution(contributionId, {
    amount_paid: data.amount_paid,
    paid_at: data.paid_at || new Date().toISOString(),
    status,
    notes: data.notes || null,
  })

  return updatedContribution
}

export async function confirmContribution(
  contributionId: string,
  adminId: string
): Promise<Contribution> {
  const contribution = await getContributionById(contributionId)
  if (!contribution) {
    throw new Error('Contribution not found')
  }

  if (contribution.status === 'confirmed') {
    throw new Error('Contribution already confirmed')
  }

  const cycle = await getCycleById(contribution.cycle_id)
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  // Process the contribution confirmation
  await processContributionConfirmation(contribution, cycle, adminId)

  // Update contribution status
  const updatedContribution = await updateContribution(contributionId, {
    status: 'confirmed',
    confirmed_by: adminId,
    confirmed_at: new Date().toISOString(),
  })

  return updatedContribution
}

async function processContributionConfirmation(
  contribution: Contribution,
  cycle: Awaited<ReturnType<typeof getCycleById>>,
  adminId: string
): Promise<void> {
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  const totalAmount = contribution.amount_paid

  // 1. Create wallet transaction for the full contribution
  await createWalletTransaction({
    user_id: contribution.user_id,
    chama_id: cycle.chama_id,
    cycle_id: contribution.cycle_id,
    type: 'contribution',
    amount: totalAmount,
    direction: 'out',
    reference_type: 'contribution',
    reference_id: contribution.id,
    description: `Contribution for period ${contribution.period_number}`,
  })

  // 2. Handle savings split if cycle has savings_amount
  if (cycle.savings_amount > 0) {
    const savingsAmount = Math.min(cycle.savings_amount, totalAmount)
    
    // Get or create savings account
    let savingsAccount = await getSavingsAccount(contribution.user_id)
    if (!savingsAccount) {
      const { createSavingsAccount } = await import('@/lib/db/queries/savings')
      savingsAccount = await createSavingsAccount(contribution.user_id)
    }

    // Update savings balance
    const newBalance = (savingsAccount.balance || 0) + savingsAmount
    await updateSavingsBalance(savingsAccount.id, newBalance)

    // Create savings transaction
    await createSavingsTransaction({
      user_id: contribution.user_id,
      savings_account_id: savingsAccount.id,
      cycle_id: contribution.cycle_id,
      amount: savingsAmount,
      type: 'credit',
      reason: 'contribution',
      balance_after: newBalance,
      reference_id: contribution.id,
      notes: `Savings from contribution period ${contribution.period_number}`,
    })

    // Create wallet transaction for savings credit
    await createWalletTransaction({
      user_id: contribution.user_id,
      chama_id: cycle.chama_id,
      cycle_id: contribution.cycle_id,
      type: 'savings_credit',
      amount: savingsAmount,
      direction: 'in',
      reference_type: 'savings_transaction',
      reference_id: contribution.id,
      description: `Savings credit from contribution`,
    })
  }

  // 3. Handle service fee if applicable
  if (cycle.service_fee > 0) {
    const feeAmount = Math.min(cycle.service_fee, totalAmount)
    
    // Create wallet transaction for service fee
    await createWalletTransaction({
      user_id: contribution.user_id,
      chama_id: cycle.chama_id,
      cycle_id: contribution.cycle_id,
      type: 'fee',
      amount: feeAmount,
      direction: 'out',
      reference_type: 'contribution',
      reference_id: contribution.id,
      description: `Service fee for contribution`,
    })
  }

  // 4. Send confirmation notification
  await createNotification({
    user_id: contribution.user_id,
    type: 'contribution_confirmed',
    title: 'Contribution Confirmed',
    message: `Your contribution of ${contribution.amount_paid} KES for period ${contribution.period_number} has been confirmed.`,
    data: JSON.stringify({
      contribution_id: contribution.id,
      cycle_id: contribution.cycle_id,
      period_number: contribution.period_number,
    }),
    chama_id: cycle.chama_id,
  })
}

