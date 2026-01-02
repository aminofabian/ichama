-- ============================================
-- 12. ADD LOAN PAYMENT STATUS
-- ============================================
-- Add status column to loan_payments for user-recorded payments that need admin approval

ALTER TABLE loan_payments 
ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE loan_payments 
ADD COLUMN recorded_by TEXT REFERENCES users(id);

ALTER TABLE loan_payments 
ADD COLUMN approved_by TEXT REFERENCES users(id);

ALTER TABLE loan_payments 
ADD COLUMN approved_at TEXT;

CREATE INDEX idx_loan_payments_status ON loan_payments(status);
CREATE INDEX idx_loan_payments_recorded_by ON loan_payments(recorded_by);

