# Troubleshooting: Admin Reminders Page

If you don't see the reminders management options, follow these steps:

## Step 1: Run the Database Migration

The reminders feature requires database tables to be created. Run:

```bash
bun run db:migrate
```

This will create:
- `reminder_templates` table
- `reminder_settings` table
- Default templates and settings

## Step 2: Verify You're an Admin

The reminders page is only accessible to platform admins. Make sure:
- Your user account is configured as an admin (check `ADMIN_EMAILS` or `ADMIN_PHONES` in environment variables)
- You're logged in with an admin account

## Step 3: Check the Sidebar

1. Navigate to `/admin` (you should see the admin dashboard)
2. Look in the left sidebar for "Reminders" with a bell icon (🔔)
3. Click on it to go to `/admin/reminders`

## Step 4: Check Browser Console

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Navigate to `/admin/reminders`
4. Check for any JavaScript errors

## Step 5: Check Network Requests

1. Open browser developer tools (F12)
2. Go to the Network tab
3. Navigate to `/admin/reminders`
4. Look for requests to:
   - `/api/admin/reminders/templates`
   - `/api/admin/reminders/settings`
5. Check if they return 200 status or show errors

## Common Issues

### Issue: "No such table: reminder_templates"
**Solution:** Run `bun run db:migrate`

### Issue: "Unauthorized" error
**Solution:** Make sure you're logged in as an admin user

### Issue: Sidebar doesn't show "Reminders"
**Solution:** 
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Restart the dev server

### Issue: Page shows "Setup Required"
**Solution:** The migration hasn't been run. Execute `bun run db:migrate`

### Issue: Page loads but shows empty cards
**Solution:** 
- Check if the migration ran successfully
- Verify the database connection
- Check API responses in Network tab

## Quick Test

After running the migration, you should see:
1. A "Reminder Settings" card with toggles
2. Four template cards (Period Started, 3 Days Before, 1 Day Before, Due Date)
3. An "Available Variables" card

If you see these, everything is working! ✅

