# Feature: Hide Savings Amount (Privacy Setting)

## Overview
Allow members to hide their savings amount from being displayed in cycle views, providing privacy control while maintaining transparency for admins.

## User Story
"As a member, I want to hide my savings amount from other members in cycle views, so I can maintain privacy while still participating in the cycle."

## Database Changes

### Migration
```sql
ALTER TABLE cycle_members 
ADD COLUMN hide_savings INTEGER DEFAULT 0;

-- 0 = visible (default)
-- 1 = hidden
```

## Business Rules

### Visibility Rules

1. **Member's Own View**
   - ✅ Always shows their actual savings amount
   - Privacy setting doesn't affect own view
   - Toggle to change privacy setting visible

2. **Other Members' View**
   - If `hide_savings = 0`: Shows actual savings amount
   - If `hide_savings = 1`: Shows "—" or "Hidden" or blank
   - No indication of whether savings is custom or default

3. **Admin View**
   - **Option A (Recommended)**: Admins always see actual amounts
     - Reason: Transparency needed for cycle management
     - Shows actual amount even if member hid it
     - May show indicator that member has privacy enabled
   
   - **Option B**: Admins also see "Hidden"
     - More privacy for members
     - Less transparency for cycle management
     - **Not recommended** for operational needs

### When Can Privacy Be Changed?
- ✅ Can be set when joining a cycle
- ✅ Can be changed at any time (before or during cycle)
- ✅ Not locked like savings amount
- ✅ Per-cycle setting (different privacy per cycle)

## UI/UX Design

### Member View (Own Savings)
```
Savings Amount: 150 KES (Custom)
☐ Hide my savings amount from other members
[Toggle explanation: "Other members won't see your savings amount"]
```

### Other Members' View
```
Savings Amount: — (Hidden)
OR
Savings Amount: 100 KES (Default)
```

### Admin View (Option A)
```
Savings Amount: 150 KES (Custom) [Privacy: Hidden from members]
OR
Savings Amount: 100 KES (Default) [Visible]
```

## Implementation Details

### API Endpoint
**Update:** `PATCH /api/chamas/[id]/cycles/[cycleId]/members/[memberId]/savings`

**Request Body:**
```typescript
{
  hide_savings?: number // 0 or 1
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    ...cycleMember,
    hide_savings: 1
  }
}
```

### Component Changes

1. **Member Cycle View** (`components/chama/member-view/cycle-summary.tsx`)
   - Add toggle switch
   - Show own savings always
   - Update privacy setting via API

2. **Member Status Table** (`components/cycle/member-status-table.tsx`)
   - Check `hide_savings` flag
   - Show "—" or "Hidden" if `hide_savings = 1` (for non-admins)
   - Show actual amount for admins

3. **Cycle Dashboard** (Admin)
   - Show actual amounts
   - Optional: Show privacy indicator

## Edge Cases

1. **Member Leaves Cycle**
   - Privacy setting remains in database
   - Not relevant after leaving

2. **Cycle Completed**
   - Privacy setting preserved for historical records
   - May want to show in history view

3. **Default Value**
   - New cycle members: `hide_savings = 0` (visible by default)
   - Existing members: `hide_savings = 0` (no breaking changes)

## Security Considerations

- Only the member themselves can change their privacy setting
- Admins cannot force visibility (respects member choice)
- API validates that user can only update their own privacy setting

## Testing Scenarios

1. ✅ Member hides savings → Other members see "Hidden"
2. ✅ Member shows savings → Other members see amount
3. ✅ Member always sees own savings (regardless of privacy)
4. ✅ Admin sees actual amounts (if Option A)
5. ✅ Privacy can be toggled anytime
6. ✅ Default is visible (0)

## Future Enhancements

- Global privacy preference (apply to all cycles)
- Chama-level privacy default
- Privacy for other financial data (contributions, payouts)

