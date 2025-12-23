# Feature Scope: Individual Savings Amounts

## Overview
Allow members in **Savings** and **Hybrid** chamas to set their own personal savings amount per cycle, instead of using the cycle's default savings amount.

## Current Implementation

### How Savings Work Now:
1. **Cycle Level**: Savings amount is set when creating a cycle (`cycles.savings_amount`)
2. **Uniform**: All members in a cycle use the same savings amount
3. **Automatic Split**: When a contribution is confirmed, the savings amount is automatically split from the contribution and credited to the member's savings account

### Current Flow:
```
Cycle Created → savings_amount = 100 KES (for all members)
Member Contributes 500 KES → 
  - 100 KES → Savings Account (same for everyone)
  - 400 KES → Payout Pool
```

## Proposed Implementation

### New Flow:
```
Cycle Created → savings_amount = 100 KES (default)
Member A joins → Sets custom savings = 150 KES
Member B joins → Uses default = 100 KES
Member C joins → Sets custom savings = 50 KES

Member A Contributes 500 KES → 
  - 150 KES → Savings Account (custom)
  - 350 KES → Payout Pool

Member B Contributes 500 KES → 
  - 100 KES → Savings Account (default)
  - 400 KES → Payout Pool

Member C Contributes 500 KES → 
  - 50 KES → Savings Account (custom)
  - 450 KES → Payout Pool
```

## Database Changes

### Option 1: Add to `cycle_members` table (RECOMMENDED)
```sql
ALTER TABLE cycle_members 
ADD COLUMN custom_savings_amount INTEGER NULL;

-- Index for queries
CREATE INDEX idx_cycle_members_custom_savings ON cycle_members(cycle_id, custom_savings_amount);
```

**Pros:**
- Per-cycle flexibility (member can have different savings in different cycles)
- Clean separation of concerns
- Easy to query

**Cons:**
- NULL handling needed (NULL = use default)

### Option 2: Add to `chama_members` table
```sql
ALTER TABLE chama_members 
ADD COLUMN default_savings_amount INTEGER NULL;
```

**Pros:**
- Persistent preference across cycles

**Cons:**
- Less flexible (same amount for all cycles in a chama)
- Doesn't allow per-cycle customization

**Decision: Use Option 1** - More flexible and aligns with cycle-based model

## TypeScript Changes

### Update `CycleMember` type:
```typescript
export interface CycleMember {
  // ... existing fields
  custom_savings_amount: number | null; // NULL = use cycle default
}
```

## Business Logic Changes

### 1. Contribution Confirmation Logic
**File:** `lib/services/contribution-service.ts`

**Current:**
```typescript
if (cycle.savings_amount > 0) {
  const savingsAmount = Math.min(cycle.savings_amount, totalAmount)
  // Credit savings...
}
```

**New:**
```typescript
// Get member's custom savings amount or use cycle default
const cycleMember = await getCycleMember(contribution.cycle_member_id)
const savingsAmount = cycleMember?.custom_savings_amount ?? cycle.savings_amount

if (savingsAmount > 0) {
  const actualSavings = Math.min(savingsAmount, totalAmount)
  // Credit savings...
}
```

### 2. Validation Rules
- Custom savings amount must be ≥ 0
- Custom savings amount cannot exceed contribution amount (enforced at contribution time)
- Can be set when joining a cycle or before cycle starts
- Cannot be changed after cycle starts (or only by admin?)

## UI/UX Changes

### 1. Cycle Creation Flow
**File:** `components/chama/create-cycle/member-selector.tsx`

**New Feature:**
- When selecting members, show an option to set custom savings amount
- Toggle: "Use custom savings amount" checkbox
- Input field: "Savings Amount" (only visible if toggle is on)
- Default: Unchecked (uses cycle default)

**UI Mock:**
```
Member: John Doe
☐ Use custom savings amount
  [If checked, show input field]
  Savings Amount: [____] KES
```

### 2. Cycle Dashboard (Admin View)
**File:** `components/cycle/member-status-table.tsx` or similar

**Display:**
- Show each member's savings amount (custom or default)
- Badge/indicator if using custom amount
- Total savings calculation per member

### 3. Member View
**File:** `components/chama/member-view/cycle-summary.tsx`

**Display:**
- Show their savings amount for the cycle
- Indicate if it's custom or default

### 4. Join Cycle Flow
**New:** When a member is added to a cycle, allow them to set custom savings

**File:** `app/api/chamas/[id]/cycles/[cycleId]/members/route.ts` (if exists)
OR
**File:** `app/api/chamas/[id]/cycles/route.ts` (when adding members to cycle)

## API Changes

### 1. Create/Update Cycle Member
**Endpoint:** `POST /api/chamas/[id]/cycles/[cycleId]/members`
**OR**
**Endpoint:** `PATCH /api/chamas/[id]/cycles/[cycleId]/members/[memberId]`

**Request Body:**
```typescript
{
  user_id: string
  turn_order: number
  custom_savings_amount?: number | null // Optional
}
```

### 2. Update Member Savings (Before Cycle Starts)
**Endpoint:** `PATCH /api/chamas/[id]/cycles/[cycleId]/members/[memberId]/savings`

**Request Body:**
```typescript
{
  custom_savings_amount: number | null
}
```

**Validation:**
- Only allowed if cycle status is 'draft' or 'pending'
- Must be ≥ 0
- If null, uses cycle default

## Edge Cases & Considerations

### 1. Cycle Already Started
- **Option A:** Lock custom savings (cannot change after start)
- **Option B:** Allow admin to change (with audit log)
- **Recommendation:** Option A - More predictable

### 2. Member Joins Mid-Cycle
- Allow setting custom savings when joining
- Applies to future contributions only
- Past contributions use cycle default

### 3. Display in Reports
- Show breakdown: "Savings (Custom: 150 KES)" vs "Savings (Default: 100 KES)"
- Total savings calculation per member

### 4. Chama Type Restrictions
- **Savings Chama:** ✅ Allow custom savings
- **Hybrid Chama:** ✅ Allow custom savings
- **Merry-go-round Chama:** ❌ No savings, so no custom savings option

### 5. Default Savings = 0
- If cycle default is 0, members can still set custom savings
- If member sets custom to 0, same as using default

## Migration Strategy

### Step 1: Database Migration
```sql
-- Add column with NULL default (existing rows use cycle default)
ALTER TABLE cycle_members 
ADD COLUMN custom_savings_amount INTEGER NULL;

CREATE INDEX idx_cycle_members_custom_savings 
ON cycle_members(cycle_id, custom_savings_amount);
```

### Step 2: Update Types
- Update `CycleMember` interface
- Update query functions

### Step 3: Update Business Logic
- Update contribution service
- Update cycle service

### Step 4: Update UI
- Add UI components for setting custom savings
- Update cycle dashboard displays

### Step 5: Testing
- Test with custom savings
- Test with default savings
- Test with NULL (should use default)
- Test validation rules

## Files to Modify

### Database
- [ ] `lib/db/migrations/XXX_individual_savings.sql` (new migration)
- [ ] `lib/types/cycle.ts` (update CycleMember interface)
- [ ] `lib/db/queries/cycle-members.ts` (update queries)

### Business Logic
- [ ] `lib/services/contribution-service.ts` (use custom savings in split)
- [ ] `lib/services/cycle-service.ts` (handle custom savings)

### API Routes
- [ ] `app/api/chamas/[id]/cycles/[cycleId]/members/route.ts` (accept custom_savings_amount)
- [ ] `app/api/chamas/[id]/cycles/[cycleId]/members/[memberId]/savings/route.ts` (new - update savings)

### UI Components
- [ ] `components/chama/create-cycle/member-selector.tsx` (add savings input)
- [ ] `components/cycle/member-status-table.tsx` (display custom savings)
- [ ] `components/chama/member-view/cycle-summary.tsx` (show member's savings)

### Forms/Hooks
- [ ] `lib/hooks/use-create-cycle-form.ts` (if exists, add savings field)
- [ ] `app/(dashboard)/chamas/[id]/cycles/new/page.tsx` (integrate savings input)

## Privacy Feature: Hide Savings Amount

### Overview
Allow members to hide their savings amount from being displayed in cycle views (privacy setting).

### Database Changes
```sql
ALTER TABLE cycle_members 
ADD COLUMN hide_savings INTEGER DEFAULT 0; -- 0 = visible, 1 = hidden
```

### Business Rules
- **Member's own view**: Always shows their savings (even if hidden from others)
- **Other members' view**: Shows "Hidden" or blank if `hide_savings = 1`
- **Admin view**: 
  - **Option A**: Admins can always see (recommended for transparency)
  - **Option B**: Admins also see "Hidden" (more privacy)
  - **Recommendation**: Option A - Admins need transparency for cycle management

### UI Changes
1. **Settings Toggle**: Add "Hide my savings amount" toggle in cycle member view
2. **Display Logic**: 
   - If hidden: Show "—" or "Hidden" instead of amount
   - If visible: Show amount as normal
3. **Admin Override**: Show actual amount for admins (if Option A)

### When to Set
- Can be set at any time (before or during cycle)
- Can be changed anytime (not locked like savings amount)
- Per-cycle setting (different privacy per cycle)

## Questions to Clarify

1. **Can members change their savings amount after cycle starts?**
   - Recommendation: No, lock it after cycle starts

2. **What if custom savings > contribution amount?**
   - Recommendation: Cap at contribution amount at confirmation time

3. **Should admins see who has custom savings?**
   - Recommendation: Yes, show in cycle dashboard

4. **Should there be a minimum/maximum custom savings?**
   - Recommendation: Minimum 0, Maximum = contribution amount

5. **What about existing cycles?**
   - Recommendation: All existing cycle_members get NULL (use default), no breaking changes

6. **Can admins see hidden savings?**
   - Recommendation: Yes, for transparency and cycle management

## Success Criteria

- ✅ Members can set custom savings when joining a cycle
- ✅ Custom savings is used when splitting contributions
- ✅ Default savings is used if custom is not set
- ✅ UI clearly shows custom vs default savings
- ✅ Validation prevents invalid savings amounts
- ✅ Works for Savings and Hybrid chamas only
- ✅ No breaking changes to existing cycles

