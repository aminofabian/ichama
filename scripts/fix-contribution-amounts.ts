/**
 * Script to fix existing contributions that have incorrect amount_due
 * (missing savings amount for savings/hybrid chamas)
 * 
 * Run with: npx tsx scripts/fix-contribution-amounts.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import db from '../lib/db/client'

async function fixContributionAmounts() {
  console.log('Starting to fix contribution amounts...\n')

  // Get all contributions that might need fixing
  const result = await db.execute({
    sql: `
      SELECT 
        c.id,
        c.amount_due,
        c.amount_paid,
        c.status,
        cy.contribution_amount,
        cy.savings_amount,
        ch.chama_type,
        cm.custom_savings_amount
      FROM contributions c
      INNER JOIN cycles cy ON c.cycle_id = cy.id
      INNER JOIN chamas ch ON cy.chama_id = ch.id
      LEFT JOIN cycle_members cm ON c.cycle_member_id = cm.id
      WHERE ch.chama_type IN ('savings', 'hybrid')
    `,
    args: [],
  })

  console.log(`Found ${result.rows.length} contributions in savings/hybrid chamas\n`)

  let fixed = 0
  let alreadyCorrect = 0

  for (const row of result.rows) {
    const contribution = row as any
    const savingsAmount = contribution.custom_savings_amount ?? contribution.savings_amount
    const correctAmountDue = contribution.contribution_amount + savingsAmount

    if (contribution.amount_due !== correctAmountDue) {
      // Recalculate status based on corrected amount_due
      let newStatus = contribution.status
      if (contribution.amount_paid >= correctAmountDue) {
        newStatus = 'paid'
      } else if (contribution.amount_paid > 0) {
        newStatus = 'partial'
      } else {
        newStatus = 'pending'
      }

      console.log(`Fixing contribution ${contribution.id}:`)
      console.log(`  Old amount_due: ${contribution.amount_due}, New: ${correctAmountDue}`)
      console.log(`  Status: ${contribution.status} -> ${newStatus}`)
      console.log(`  (contribution: ${contribution.contribution_amount}, savings: ${savingsAmount})`)

      await db.execute({
        sql: `UPDATE contributions SET amount_due = ?, status = ?, updated_at = ? WHERE id = ?`,
        args: [correctAmountDue, newStatus, new Date().toISOString(), contribution.id],
      })

      fixed++
    } else {
      alreadyCorrect++
    }
  }

  console.log(`\nDone!`)
  console.log(`  Fixed: ${fixed}`)
  console.log(`  Already correct: ${alreadyCorrect}`)
}

fixContributionAmounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
