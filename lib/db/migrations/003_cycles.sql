-- ============================================
-- 3. CYCLES (THE MONEY ENGINE)
-- ============================================

CREATE TABLE cycles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contribution_amount INTEGER NOT NULL,
    payout_amount INTEGER NOT NULL,
    savings_amount INTEGER NOT NULL,
    service_fee INTEGER NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    total_periods INTEGER NOT NULL,
    current_period INTEGER DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_cycles_chama ON cycles(chama_id);
CREATE INDEX idx_cycles_status ON cycles(status);

CREATE TABLE cycle_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    chama_member_id TEXT NOT NULL REFERENCES chama_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    assigned_number INTEGER,
    turn_order INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'defaulted', 'completed', 'removed')),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(cycle_id, chama_member_id)
);

CREATE INDEX idx_cycle_members_cycle ON cycle_members(cycle_id);
CREATE INDEX idx_cycle_members_user ON cycle_members(user_id);

