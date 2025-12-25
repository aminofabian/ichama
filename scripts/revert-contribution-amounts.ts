/**
 * Revert contributions to correct amount_due (contribution only, not including savings)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import db from '../lib/db/client'

async function revertContributionAmounts() {
  console.log('Reverting contribution amounts...\n')

  // Get all contributions and set amount_due back to just contribution_amount
  const result = await db.execute({
    sql: `
      SELECT 
        c.id,
        c.amount_due,
        c.amount_paid,
        cy.contribution_amount
      FROM contributions c
      INNER JOIN cycles cy ON c.cycle_id = cy.id
    `,
    args: [],
  })

  console.log(`Found ${result.rows.length} contributions\n`)

  let fixed = 0

  for (const row of result.rows) {
    const contribution = row as any
    
    if (contribution.amount_due !== contribution.contribution_amount) {
      // Recalculate status based on contribution_amount only
      let newStatus = 'pending'
      if (contribution.amount_paid >= contribution.contribution_amount) {
        newStatus = 'paid'
      } else if (contribution.amount_paid > 0) {
        newStatus = 'partial'
      }

      console.log(`Reverting ${contribution.id}: ${contribution.amount_due} -> ${contribution.contribution_amount}, status: ${newStatus}`)

      await db.execute({
        sql: `UPDATE contributions SET amount_due = ?, status = ?, updated_at = ? WHERE id = ?`,
        args: [contribution.contribution_amount, newStatus, new Date().toISOString(), contribution.id],
      })

      fixed++
    }
  }

  console.log(`\nReverted ${fixed} contributions`)
}

revertContributionAmounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
