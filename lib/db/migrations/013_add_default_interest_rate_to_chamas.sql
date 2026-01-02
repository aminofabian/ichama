-- Add default_interest_rate column to chamas table
ALTER TABLE chamas
ADD COLUMN default_interest_rate REAL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_chamas_default_interest_rate ON chamas(default_interest_rate);

