-- ============================================
-- 9. ADD CHAMA_ID TO LOANS
-- ============================================
-- Add chama_id column to existing loans table

-- Check if column exists, if not add it
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll try to add it and catch the error if it already exists

ALTER TABLE loans 
ADD COLUMN chama_id TEXT REFERENCES chamas(id) ON DELETE CASCADE;

-- Update existing loans to have a default chama_id (if any exist)
-- This will need to be handled manually or set to NULL for existing records
-- For now, we'll allow NULL temporarily, then make it NOT NULL in a follow-up migration

-- Create index for chama_id
CREATE INDEX IF NOT EXISTS idx_loans_chama ON loans(chama_id);

