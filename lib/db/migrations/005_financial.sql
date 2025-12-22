-- ============================================
-- 5. SAVINGS & WALLET
-- ============================================

CREATE TABLE savings_accounts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE savings_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    savings_account_id TEXT NOT NULL REFERENCES savings_accounts(id),
    cycle_id TEXT REFERENCES cycles(id),
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    reason TEXT NOT NULL CHECK (reason IN ('contribution', 'withdrawal', 'bonus', 'penalty', 'adjustment')),
    balance_after INTEGER NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_savings_tx_user ON savings_transactions(user_id);
CREATE INDEX idx_savings_tx_account ON savings_transactions(savings_account_id);

CREATE TABLE wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chama_id TEXT REFERENCES chamas(id),
    cycle_id TEXT REFERENCES cycles(id),
    type TEXT NOT NULL CHECK (type IN ('contribution', 'payout', 'savings_credit', 'savings_debit', 'fee', 'refund')),
    amount INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    reference_type TEXT,
    reference_id TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_cycle ON wallet_transactions(cycle_id);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);

