-- ============================================
-- 11. MAKE LOANS CHAMA_ID NOT NULL
-- ============================================
-- Make chama_id NOT NULL in loans table
-- Note: This assumes there are no existing loans without chama_id
-- If there are, they need to be deleted or assigned a chama_id first

-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table
-- First, check if there are any loans without chama_id
-- If there are, this migration will fail and needs manual intervention

-- Create new table with NOT NULL constraint
CREATE TABLE loans_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'active', 'paid', 'defaulted', 'cancelled')),
    interest_rate INTEGER DEFAULT 0,
    repayment_period_days INTEGER,
    due_date TEXT,
    amount_paid INTEGER DEFAULT 0,
    approved_at TEXT,
    approved_by TEXT REFERENCES users(id),
    disbursed_at TEXT,
    paid_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Copy data from old table (only rows with chama_id)
INSERT INTO loans_new 
SELECT * FROM loans 
WHERE chama_id IS NOT NULL;

-- Drop old table
DROP TABLE loans;

-- Rename new table
ALTER TABLE loans_new RENAME TO loans;

-- Recreate indexes
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_chama ON loans(chama_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);

