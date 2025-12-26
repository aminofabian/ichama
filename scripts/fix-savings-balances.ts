/**
 * Fix savings balances - recalculate based on actual payments
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import db from '../lib/db/client'

async function fixSavingsBalances() {
  console.log('Fixing savings balances...\n')

  // Get all confirmed contributions with their cycle and chama info
  const contributions = await db.execute({
    sql: `
      SELECT 
        c.id, c.user_id, c.amount_paid, c.status,
        cy.contribution_amount, cy.savings_amount,
        cm.custom_savings_amount,
        ch.chama_type
      FROM contributions c
      JOIN cycles cy ON c.cycle_id = cy.id
      JOIN chamas ch ON cy.chama_id = ch.id
      LEFT JOIN cycle_members cm ON c.cycle_member_id = cm.id
      WHERE c.status = 'confirmed'
    `,
    args: [],
  })

  // Calculate correct savings per user
  const userSavings: Record<string, number> = {}

  for (const row of contributions.rows) {
    const c = row as any
    const savingsTarget = c.custom_savings_amount ?? c.savings_amount
    const chamaType = c.chama_type
    
    // Calculate savings based on chama type
    let actualSavings = 0
    if (savingsTarget > 0 && (chamaType === 'savings' || chamaType === 'hybrid')) {
      if (chamaType === 'savings') {
        // For savings chamas: all amount paid is savings (up to the savings target)
        actualSavings = Math.min(c.amount_paid, savingsTarget)
      } else if (chamaType === 'hybrid') {
        // For hybrid chamas: savings = amount paid beyond contribution, capped at savings target
    const savingsFromPayment = Math.max(0, c.amount_paid - c.contribution_amount)
        actualSavings = Math.min(savingsTarget, savingsFromPayment)
      }
    }
    
    if (!userSavings[c.user_id]) {
      userSavings[c.user_id] = 0
    }
    userSavings[c.user_id] += actualSavings
    
    console.log(`Contribution ${c.id.slice(0,8)}...: paid ${c.amount_paid}, contrib ${c.contribution_amount}, chama_type ${chamaType}, savings portion: ${actualSavings}`)
  }

  console.log('\nCalculated savings per user:')
  for (const [userId, savings] of Object.entries(userSavings)) {
    console.log(`  User ${userId.slice(0,8)}...: ${savings}`)
  }

  // Update savings accounts
  console.log('\nUpdating savings accounts...')
  for (const [userId, correctBalance] of Object.entries(userSavings)) {
    const account = await db.execute({
      sql: 'SELECT id, balance FROM savings_accounts WHERE user_id = ?',
      args: [userId],
    })

    if (account.rows.length > 0) {
      const current = account.rows[0] as any
      if (current.balance !== correctBalance) {
        console.log(`  Updating ${userId.slice(0,8)}...: ${current.balance} -> ${correctBalance}`)
        await db.execute({
          sql: 'UPDATE savings_accounts SET balance = ?, updated_at = ? WHERE id = ?',
          args: [correctBalance, new Date().toISOString(), current.id],
        })
      }
    }
  }

  console.log('\nDone!')
}

fixSavingsBalances()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
