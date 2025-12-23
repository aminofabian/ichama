import { config } from 'dotenv'

// Load environment variables for tests
config({ path: '.env.local' })
config({ path: '.env' })

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

