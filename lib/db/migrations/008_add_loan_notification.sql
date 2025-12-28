-- ============================================
-- 8. ADD LOAN NOTIFICATION TYPE
-- ============================================
-- Add 'loan_requested' to notification types
-- SQLite doesn't support ALTER TABLE for CHECK constraints,
-- so we'll recreate the table with the new constraint

-- Create new table with updated constraint
CREATE TABLE notifications_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'contribution_reminder', 'contribution_confirmed', 'contribution_overdue',
        'payout_scheduled', 'payout_sent', 'payout_received',
        'cycle_started', 'cycle_ended', 'cycle_period_advanced',
        'member_joined', 'member_left', 'member_removed',
        'invite_received', 'invite_accepted',
        'announcement', 'dispute_update', 'rating_changed',
        'loan_requested',
        'system'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    chama_id TEXT REFERENCES chamas(id),
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Copy data from old table
INSERT INTO notifications_new SELECT * FROM notifications;

-- Drop old table
DROP TABLE notifications;

-- Rename new table
ALTER TABLE notifications_new RENAME TO notifications;

-- Recreate indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at);


