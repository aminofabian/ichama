-- ============================================
-- 7. LOANS
-- ============================================

CREATE TABLE loans (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);

CREATE TABLE loan_guarantors (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    guarantor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_at TEXT,
    rejected_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(loan_id, guarantor_user_id)
);

CREATE INDEX idx_loan_guarantors_loan ON loan_guarantors(loan_id);
CREATE INDEX idx_loan_guarantors_guarantor ON loan_guarantors(guarantor_user_id);
CREATE INDEX idx_loan_guarantors_status ON loan_guarantors(status);

CREATE TABLE loan_payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_method TEXT,
    reference_id TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);

