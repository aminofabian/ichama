-- ============================================
-- 4. CONTRIBUTIONS & PAYOUTS
-- ============================================

CREATE TABLE contributions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    cycle_member_id TEXT NOT NULL REFERENCES cycle_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    period_number INTEGER NOT NULL,
    amount_due INTEGER NOT NULL,
    amount_paid INTEGER DEFAULT 0,
    due_date TEXT NOT NULL,
    paid_at TEXT,
    confirmed_by TEXT REFERENCES users(id),
    confirmed_at TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'late', 'missed', 'partial')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(cycle_id, cycle_member_id, period_number)
);

CREATE INDEX idx_contributions_cycle ON contributions(cycle_id);
CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_contributions_due ON contributions(due_date);

CREATE TABLE payouts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    cycle_member_id TEXT NOT NULL REFERENCES cycle_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    period_number INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'paid', 'confirmed', 'skipped')),
    scheduled_date TEXT,
    paid_at TEXT,
    paid_by TEXT REFERENCES users(id),
    confirmed_by_member INTEGER DEFAULT 0,
    confirmed_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(cycle_id, period_number)
);

CREATE INDEX idx_payouts_cycle ON payouts(cycle_id);
CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

CREATE TABLE defaults (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    cycle_member_id TEXT NOT NULL REFERENCES cycle_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    period_number INTEGER NOT NULL,
    contribution_id TEXT REFERENCES contributions(id),
    reason TEXT NOT NULL,
    penalty_amount INTEGER DEFAULT 0,
    penalty_points INTEGER DEFAULT 0,
    resolved INTEGER DEFAULT 0,
    resolved_at TEXT,
    resolved_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_defaults_cycle ON defaults(cycle_id);
CREATE INDEX idx_defaults_user ON defaults(user_id);

