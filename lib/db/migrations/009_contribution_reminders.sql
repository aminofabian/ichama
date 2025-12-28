-- ============================================
-- 9. CONTRIBUTION REMINDERS TRACKING
-- ============================================

CREATE TABLE contribution_reminders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    contribution_id TEXT NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('period_started', 'three_days_before', 'one_day_before', 'due_date')),
    sent_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(contribution_id, reminder_type)
);

CREATE INDEX idx_reminders_contribution ON contribution_reminders(contribution_id);
CREATE INDEX idx_reminders_type ON contribution_reminders(reminder_type);
CREATE INDEX idx_reminders_sent ON contribution_reminders(sent_at);

