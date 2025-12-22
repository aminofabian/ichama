-- ============================================
-- 6. PLATFORM & NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'contribution_reminder', 'contribution_confirmed', 'contribution_overdue',
        'payout_scheduled', 'payout_sent', 'payout_received',
        'cycle_started', 'cycle_ended', 'cycle_period_advanced',
        'member_joined', 'member_left', 'member_removed',
        'invite_received', 'invite_accepted',
        'announcement', 'dispute_update', 'rating_changed',
        'system'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    chama_id TEXT REFERENCES chamas(id),
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at);

CREATE TABLE announcements (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_announcements_chama ON announcements(chama_id);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    actor_id TEXT REFERENCES users(id),
    actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'admin')),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

CREATE TABLE platform_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES users(id),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Default settings
INSERT INTO platform_settings (key, value, description) VALUES
    ('default_service_fee_percentage', '3', 'Default service fee percentage for new cycles'),
    ('min_contribution_amount', '100', 'Minimum contribution amount in KES'),
    ('max_contribution_amount', '100000', 'Maximum contribution amount in KES'),
    ('max_members_per_chama', '50', 'Maximum members allowed per chama'),
    ('otp_expiry_minutes', '10', 'OTP code expiry time in minutes'),
    ('invite_expiry_days', '7', 'Invitation link expiry time in days'),
    ('maintenance_mode', 'false', 'Platform maintenance mode flag');

