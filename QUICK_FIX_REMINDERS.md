# Quick Fix: Reminders Page Not Showing

## The Problem
The reminders page exists but you're not seeing it. This is likely because:
1. The database migration hasn't been run
2. The page is showing an error that's not visible

## Solution

### Step 1: Run the Migration
```bash
bun run db:migrate
```

This will create the required tables:
- `reminder_templates`
- `reminder_settings`
- `contribution_reminders`

### Step 2: Verify the Page is Accessible

**Option A: Direct URL**
Navigate directly to: `http://localhost:3000/admin/reminders`

**Option B: Via Sidebar**
1. Go to `/admin`
2. Look for "Reminders" in the left sidebar (should be between "Chamas" and "Settings")
3. Click on it

### Step 3: Check What You Should See

After running the migration, you should see:
- ✅ Page title: "WhatsApp Reminders"
- ✅ "Reminder Settings" card with toggles
- ✅ Four template cards for editing messages
- ✅ "Available Variables" card

### Step 4: If Still Not Showing

1. **Hard refresh the browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Check browser console**: Press F12, look for errors
3. **Check Network tab**: Press F12 → Network tab → Refresh page → Look for `/api/admin/reminders/templates` and `/api/admin/reminders/settings`
4. **Restart dev server**: Stop and restart `bun dev`

### Step 5: Verify Migration Ran

Check if tables exist:
```bash
# If using SQLite/Turso, you can check the database
# Or check the migration script output
```

The migration should show:
```
✓ Completed: 010_reminder_templates.sql
```

## Still Not Working?

If after running the migration you still don't see the page:

1. Check if you're logged in as an admin user
2. Verify the sidebar component is loading (check if other admin pages work)
3. Check the browser's Network tab for failed API calls
4. Look at the server console for errors

The page should ALWAYS render something - either:
- Loading spinner
- Error message with setup instructions
- The full reminders management UI

If you see a blank page, there's likely a JavaScript error preventing rendering.

