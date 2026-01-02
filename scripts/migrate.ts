import { config } from 'dotenv'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

config({ path: '.env.local' })
config({ path: '.env' })

const MIGRATIONS_DIR = join(process.cwd(), 'lib/db/migrations')

function splitSQLStatements(sql: string): string[] {
  const statements: string[] = []
  let currentStatement = ''
  let inString = false
  let stringChar = ''

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1]

    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      currentStatement += char
    } else if (inString && char === stringChar && sql[i - 1] !== '\\') {
      inString = false
      stringChar = ''
      currentStatement += char
    } else if (!inString && char === ';') {
      const trimmed = currentStatement.trim()
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed)
      }
      currentStatement = ''
    } else if (!inString && char === '-' && nextChar === '-') {
      while (i < sql.length && sql[i] !== '\n') {
        i++
      }
    } else {
      currentStatement += char
    }
  }

  const trimmed = currentStatement.trim()
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed)
  }

  return statements.filter((stmt) => stmt.length > 0)
}

async function runMigrations() {
  try {
    const db = (await import('../lib/db/client')).default

    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT UNIQUE NOT NULL,
        executed_at TEXT DEFAULT (datetime('now'))
      )`,
    })

    const files = await readdir(MIGRATIONS_DIR)
    const sqlFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort()

    console.log(`Found ${sqlFiles.length} migration files`)

    const executedMigrations = await db.execute({
      sql: 'SELECT migration_name FROM schema_migrations',
    })
    const executedSet = new Set(
      executedMigrations.rows.map((row: any) => row.migration_name)
    )

    for (const file of sqlFiles) {
      if (executedSet.has(file)) {
        console.log(`⏭️  Skipping already executed: ${file}`)
        continue
      }

      const filePath = join(MIGRATIONS_DIR, file)
      const sql = await readFile(filePath, 'utf-8')
      const statements = splitSQLStatements(sql)

      console.log(`Running migration: ${file} (${statements.length} statements)`)

      try {
      for (const statement of statements) {
        if (statement.trim()) {
            try {
          await db.execute(statement)
            } catch (stmtError: any) {
              const errorMsg = stmtError.message || ''
              const errorCode = stmtError.code || ''
              if (
                errorMsg.includes('already exists') ||
                errorMsg.includes('duplicate column') ||
                errorMsg.includes('UNIQUE constraint failed') ||
                errorMsg.includes('no such column') ||
                errorCode === 'SQLITE_CONSTRAINT'
              ) {
                console.log(`  ⚠️  Skipping statement (constraint violation): ${statement.substring(0, 50)}...`)
                continue
              }
              throw stmtError
            }
          }
        }

        await db.execute({
          sql: 'INSERT INTO schema_migrations (migration_name) VALUES (?)',
          args: [file],
        })

        console.log(`✓ Completed: ${file}`)
      } catch (error: any) {
        const errorMsg = error.message || ''
        const errorCode = error.code || ''
        if (
          errorMsg.includes('already exists') ||
          errorMsg.includes('duplicate column') ||
          errorMsg.includes('UNIQUE constraint failed') ||
          errorCode === 'SQLITE_CONSTRAINT'
        ) {
          console.log(`⚠️  Migration partially applied, marking as executed: ${file}`)
          await db.execute({
            sql: 'INSERT OR IGNORE INTO schema_migrations (migration_name) VALUES (?)',
            args: [file],
          })
        } else {
          throw error
        }
      }
    }

    console.log('\n✅ All migrations completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()

