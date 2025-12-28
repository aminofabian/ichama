# Admin Reminder Management

This document explains the admin features for managing WhatsApp contribution reminders.

## Features

### 1. Customize Reminder Messages
Admins can modify the text of all reminder messages through the admin panel at `/admin/reminders`.

### 2. Enable/Disable Reminders
- **Global Toggle**: Enable or disable all reminders at once
- **Per-Type Toggle**: Enable/disable specific reminder types:
  - Period Started (7 days before)
  - 3 Days Before
  - 1 Day Before
  - Due Date (Today)

### 3. Template Variables
Use these variables in your custom templates:
- `{{userName}}` - User's full name
- `{{chamaName}}` - Chama name
- `{{cycleName}}` - Cycle name
- `{{amount}}` - Formatted contribution amount (KES)
- `{{dueDate}}` - Formatted due date
- `{{daysUntilDue}}` - Number of days until due date
- `{{periodNumber}}` - Current period number

## Access

Navigate to: **Admin Panel → Reminders** (`/admin/reminders`)

Only platform admins can access this page.

## Usage

### Modifying a Template

1. Go to `/admin/reminders`
2. Find the reminder type you want to modify
3. Edit the template text in the textarea
4. Click "Save Changes"
5. Use "Preview" to see how it will look

### Disabling a Reminder Type

1. Toggle the switch next to the reminder type name
2. Click "Save Settings" at the top

### Disabling All Reminders

1. Toggle "Enable All Reminders" at the top
2. Click "Save Settings"

## Example Custom Template

**Default Period Started Template:**
```
🎉 Hello {{userName}}!

A new period has started for "{{cycleName}}" in {{chamaName}}.

💰 Contribution Amount: {{amount}}
📅 Due Date: {{dueDate}}
⏰ You have {{daysUntilDue}} days to make your contribution.

Don't forget to contribute on time! 💪
```

**Custom Template Example:**
```
Hi {{userName}}! 👋

New contribution period for {{chamaName}} is here!

Amount: {{amount}}
Deadline: {{dueDate}}
Days left: {{daysUntilDue}}

Make your payment to stay on track! 🚀
```

## Database

Templates are stored in the `reminder_templates` table:
- Each reminder type has one template
- Templates can be active or inactive
- Templates support variable replacement

Settings are stored in the `reminder_settings` table:
- Global enable/disable flag
- Per-type enable/disable flags

## API Endpoints

### Get Templates
```
GET /api/admin/reminders/templates
```

### Update Template
```
POST /api/admin/reminders/templates
Body: {
  reminder_type: 'period_started' | 'three_days_before' | 'one_day_before' | 'due_date',
  template_text: string,
  is_active: 0 | 1
}
```

### Get Settings
```
GET /api/admin/reminders/settings
```

### Update Settings
```
PATCH /api/admin/reminders/settings
Body: {
  settings: {
    reminders_enabled: '1' | '0',
    send_period_started: '1' | '0',
    send_three_days_before: '1' | '0',
    send_one_day_before: '1' | '0',
    send_due_date: '1' | '0'
  }
}
```

## Notes

- Changes take effect immediately for new reminders
- Already-sent reminders are not affected
- The cron job respects all settings and will skip disabled reminder types
- Templates are validated but no strict format is enforced - be careful with variable names!

