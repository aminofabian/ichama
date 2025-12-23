import { config } from 'dotenv'
import db from '../lib/db/client'
import { nanoid } from 'nanoid'
import { hashPassword } from '../lib/auth/password'
import { normalizePhone } from '../lib/utils/phone'
import { generateInviteCode } from '../lib/utils/invite-code'

config({ path: '.env.local' })
config({ path: '.env' })

interface SeedData {
  users: Array<{ id: string; full_name: string; phone_number: string; email: string | null }>
  chamas: Array<{ id: string; created_by: string }>
}

async function seed() {
  console.log('🌱 Starting database seeding...\n')

  try {
    // Create demo users
    console.log('Creating demo users...')
    const passwordHash = await hashPassword('demo123')
    const users: SeedData['users'] = []

    const userData = [
      { name: 'John Doe', phone: '254712345678', email: 'john@demo.com' },
      { name: 'Jane Smith', phone: '254723456789', email: 'jane@demo.com' },
      { name: 'Mary Wanjiku', phone: '254734567890', email: 'mary@demo.com' },
      { name: 'Peter Kamau', phone: '254745678901', email: 'peter@demo.com' },
      { name: 'Sarah Ochieng', phone: '254756789012', email: 'sarah@demo.com' },
    ]

    for (const user of userData) {
      const id = nanoid()
      const normalizedPhone = normalizePhone(user.phone)
      const now = new Date().toISOString()

      // Check if user already exists
      const existing = await db.execute({
        sql: 'SELECT id FROM users WHERE phone_number = ?',
        args: [normalizedPhone],
      })

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  User ${user.name} already exists, skipping...`)
        const existingUser = existing.rows[0] as unknown as { id: string }
        users.push({
          id: existingUser.id,
          full_name: user.name,
          phone_number: normalizedPhone,
          email: user.email,
        })
        continue
      }

      await db.execute({
        sql: `INSERT INTO users (id, full_name, phone_number, email, password_hash, phone_verified_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, user.name, normalizedPhone, user.email, passwordHash, now, now, now],
      })

      users.push({
        id,
        full_name: user.name,
        phone_number: normalizedPhone,
        email: user.email,
      })
      console.log(`  ✅ Created user: ${user.name}`)
    }

    // Create demo chamas
    console.log('\nCreating demo chamas...')
    const chamas: SeedData['chamas'] = []

    const chamaData = [
      {
        name: 'Harambee Savings Group',
        description: 'A community savings group for school fees and emergencies',
        type: 'savings' as const,
        creatorIndex: 0,
        memberIndices: [0, 1, 2],
      },
      {
        name: 'Weekly Merry-Go-Round',
        description: 'Weekly rotating savings for members',
        type: 'merry_go_round' as const,
        creatorIndex: 1,
        memberIndices: [1, 2, 3, 4],
      },
      {
        name: 'Monthly Investment Group',
        description: 'Hybrid savings and investment group',
        type: 'hybrid' as const,
        creatorIndex: 2,
        memberIndices: [0, 2, 3],
      },
    ]

    for (const chama of chamaData) {
      const id = nanoid()
      const creator = users[chama.creatorIndex]
      const inviteCode = generateInviteCode()
      const now = new Date().toISOString()

      // Check if chama already exists
      const existing = await db.execute({
        sql: 'SELECT id FROM chamas WHERE name = ?',
        args: [chama.name],
      })

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Chama "${chama.name}" already exists, skipping...`)
        const existingChama = existing.rows[0] as unknown as { id: string }
        chamas.push({ id: existingChama.id, created_by: creator.id })
        continue
      }

      await db.execute({
        sql: `INSERT INTO chamas (id, name, description, created_by, chama_type, invite_code, is_private, max_members, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          chama.name,
          chama.description,
          creator.id,
          chama.type,
          inviteCode,
          0,
          20,
          'active',
          now,
          now,
        ],
      })

      // Add members
      for (let i = 0; i < chama.memberIndices.length; i++) {
        const memberIndex = chama.memberIndices[i]
        const member = users[memberIndex]
        const role = i === 0 ? 'admin' : 'member'

        await db.execute({
          sql: `INSERT INTO chama_members (id, chama_id, user_id, role, status, joined_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [nanoid(), id, member.id, role, 'active', now],
        })
      }

      chamas.push({ id, created_by: creator.id })
      console.log(`  ✅ Created chama: ${chama.name} with ${chama.memberIndices.length} members`)
    }

    // Create a demo cycle for the first chama
    if (chamas.length > 0) {
      console.log('\nCreating demo cycle...')
      const firstChama = chamas[0]
      const chamaMembers = await db.execute({
        sql: 'SELECT * FROM chama_members WHERE chama_id = ? AND status = ?',
        args: [firstChama.id, 'active'],
      })

      if (chamaMembers.rows.length > 0) {
        const cycleId = nanoid()
        const now = new Date().toISOString()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7) // Started a week ago

        // Check if cycle already exists
        const existingCycle = await db.execute({
          sql: 'SELECT id FROM cycles WHERE chama_id = ? AND name = ?',
          args: [firstChama.id, 'Demo Cycle 2024'],
        })

        if (existingCycle.rows.length === 0) {
          await db.execute({
            sql: `INSERT INTO cycles (
                    id, chama_id, name, contribution_amount, payout_amount, 
                    frequency, total_periods, current_period, status, 
                    start_date, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              cycleId,
              firstChama.id,
              'Demo Cycle 2024',
              1000,
              4000,
              'weekly',
              4,
              1,
              'active',
              startDate.toISOString(),
              now,
              now,
            ],
          })

          // Add cycle members with turn order
          const members = chamaMembers.rows as unknown as Array<{ id: string; user_id: string }>
          for (let i = 0; i < members.length; i++) {
            await db.execute({
              sql: `INSERT INTO cycle_members (id, cycle_id, user_id, turn_order, joined_at)
                    VALUES (?, ?, ?, ?, ?)`,
              args: [nanoid(), cycleId, members[i].user_id, i + 1, now],
            })
          }

          // Create a contribution for the first member
          const firstCycleMember = await db.execute({
            sql: 'SELECT * FROM cycle_members WHERE cycle_id = ? AND turn_order = ?',
            args: [cycleId, 1],
          })

          if (firstCycleMember.rows.length > 0) {
            const cycleMember = firstCycleMember.rows[0] as unknown as { id: string; user_id: string }
            const contributionId = nanoid()
            const dueDate = new Date(startDate)
            dueDate.setDate(dueDate.getDate() + 7)

            await db.execute({
              sql: `INSERT INTO contributions (
                      id, cycle_id, cycle_member_id, user_id, period_number,
                      amount_due, amount_paid, due_date, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                contributionId,
                cycleId,
                cycleMember.id,
                cycleMember.user_id,
                1,
                1000,
                1000,
                dueDate.toISOString(),
                'paid',
                now,
                now,
              ],
            })
          }

          console.log(`  ✅ Created cycle: Demo Cycle 2024`)
        } else {
          console.log(`  ⏭️  Cycle already exists, skipping...`)
        }
      }
    }

    console.log('\n✨ Seeding completed successfully!')
    console.log('\nDemo credentials:')
    console.log('  Phone: 254712345678')
    console.log('  Password: demo123')
    console.log('\nNote: All demo users use the same password (demo123)')
  } catch (error) {
    console.error('\n❌ Error seeding database:', error)
    process.exit(1)
  }
}

seed()

