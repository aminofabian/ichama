-- ============================================
-- 10. REMINDER TEMPLATES (ADMIN CUSTOMIZABLE)
-- ============================================

CREATE TABLE reminder_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    reminder_type TEXT NOT NULL UNIQUE CHECK (reminder_type IN ('period_started', 'three_days_before', 'one_day_before', 'due_date')),
    template_text TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_reminder_templates_type ON reminder_templates(reminder_type);
CREATE INDEX idx_reminder_templates_active ON reminder_templates(is_active);

-- Insert default templates
INSERT INTO reminder_templates (reminder_type, template_text, is_active) VALUES
('period_started', '🎉 Hello {{userName}}!\n\nA new period has started for "{{cycleName}}" in {{chamaName}}.\n\n💰 Contribution Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n⏰ You have {{daysUntilDue}} days to make your contribution.\n\nDon''t forget to contribute on time! 💪', 1),
('three_days_before', '⏰ Reminder: {{userName}}\n\nYour contribution for "{{cycleName}}" in {{chamaName}} is due in 3 days.\n\n💰 Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n\nPlease make your contribution soon to avoid any delays. 🙏', 1),
('one_day_before', '🚨 Final Reminder: {{userName}}\n\nYour contribution for "{{cycleName}}" in {{chamaName}} is due TOMORROW!\n\n💰 Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n\nPlease make your contribution today to stay on track. ⚡', 1),
('due_date', '📢 Today''s the Day, {{userName}}!\n\nYour contribution for "{{cycleName}}" in {{chamaName}} is due TODAY.\n\n💰 Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n\nPlease make your contribution now to complete your payment. ✅', 1);

CREATE TABLE reminder_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default settings
INSERT INTO reminder_settings (setting_key, setting_value, description) VALUES
('reminders_enabled', '1', 'Enable/disable all WhatsApp reminders'),
('send_period_started', '1', 'Send reminder when period starts (7 days before)'),
('send_three_days_before', '1', 'Send reminder 3 days before due date'),
('send_one_day_before', '1', 'Send reminder 1 day before due date'),
('send_due_date', '1', 'Send reminder on due date');

