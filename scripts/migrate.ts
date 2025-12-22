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

    const files = await readdir(MIGRATIONS_DIR)
    const sqlFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort()

    console.log(`Found ${sqlFiles.length} migration files`)

    for (const file of sqlFiles) {
      const filePath = join(MIGRATIONS_DIR, file)
      const sql = await readFile(filePath, 'utf-8')
      const statements = splitSQLStatements(sql)

      console.log(`Running migration: ${file} (${statements.length} statements)`)

      for (const statement of statements) {
        if (statement.trim()) {
          await db.execute(statement)
        }
      }

      console.log(`✓ Completed: ${file}`)
    }

    console.log('\n✅ All migrations completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()

