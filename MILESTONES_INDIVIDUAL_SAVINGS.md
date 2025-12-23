# Milestones: Individual Savings Amounts Feature

## Overview
Allow members in **Savings** and **Hybrid** chamas to set their own personal savings amount per cycle, instead of using the cycle's default savings amount.

---

## M19: Database & Types Foundation
**Goal:** Set up database schema and TypeScript types for individual savings amounts.

### Tasks

- [ ] **M19.1** Create database migration
  - Add `custom_savings_amount` column to `cycle_members` table
  - Add `hide_savings` column to `cycle_members` table (privacy setting)
  - Add index for performance
  - Migration file: `lib/db/migrations/XXX_individual_savings.sql`

- [ ] **M19.2** Update TypeScript types
  - Update `CycleMember` interface in `lib/types/cycle.ts`
  - Add `custom_savings_amount: number | null` field
  - Add `hide_savings: number` field (0 = visible, 1 = hidden)

- [ ] **M19.3** Update database queries
  - Update `createCycleMember` in `lib/db/queries/cycle-members.ts`
  - Update `getCycleMembers` to include custom_savings_amount
  - Update `updateCycleMember` to handle custom_savings_amount

**Deliverable:** Database schema updated, types defined, queries ready.

---

## M20: Business Logic Implementation
**Goal:** Update contribution processing to use individual savings amounts.

### Tasks

- [ ] **M20.1** Update contribution service
  - Modify `processContributionConfirmation` in `lib/services/contribution-service.ts`
  - Logic: Use `cycleMember.custom_savings_amount ?? cycle.savings_amount`
  - Ensure proper validation (savings ≤ contribution amount)

- [ ] **M20.2** Add validation utilities
  - Create function to validate custom savings amount
  - Check: ≥ 0, ≤ contribution amount, only for savings/hybrid chamas
  - File: `lib/utils/validation.ts` (add new function)

- [ ] **M20.3** Update cycle service (if needed)
  - Ensure cycle member creation handles custom savings
  - Add validation when cycle status changes (lock after start)

**Deliverable:** Contributions correctly split using individual savings amounts.

---

## M21: API Routes
**Goal:** Create/update API endpoints for managing individual savings.

### Tasks

- [ ] **M21.1** Update cycle member creation endpoint
  - Modify `POST /api/chamas/[id]/cycles/[cycleId]/members`
  - Accept `custom_savings_amount` in request body
  - Validate: ≥ 0, only for savings/hybrid chamas

- [ ] **M21.2** Create update savings endpoint
  - New: `PATCH /api/chamas/[id]/cycles/[cycleId]/members/[memberId]/savings`
  - Allow updating custom savings before cycle starts
  - Lock if cycle status is 'active' or later
  - Also accept `hide_savings` parameter (can be changed anytime)

- [ ] **M21.3** Update cycle creation endpoint
  - Modify `POST /api/chamas/[id]/cycles`
  - Accept `custom_savings_amount` for each member in member selection
  - Validate all savings amounts

**Deliverable:** API endpoints support individual savings amounts.

---

## M22: UI - Cycle Creation Flow
**Goal:** Add UI for setting individual savings during cycle creation.

### Tasks

- [ ] **M22.1** Update member selector component
  - File: `components/chama/create-cycle/member-selector.tsx`
  - Add toggle: "Use custom savings amount"
  - Add input field (visible when toggle is on)
  - Show cycle default savings amount as reference

- [ ] **M22.2** Update cycle form hook
  - File: `lib/hooks/use-create-cycle-form.ts` (if exists)
  - Add state for member savings amounts
  - Store as `Map<memberId, savingsAmount | null>`

- [ ] **M22.3** Update cycle creation page
  - File: `app/(dashboard)/chamas/[id]/cycles/new/page.tsx`
  - Integrate savings input in member selection step
  - Pass savings amounts when creating cycle

- [ ] **M22.4** Add validation feedback
  - Show error if custom savings > contribution amount
  - Show warning if custom savings = 0 (no savings)
  - Disable for merry-go-round chamas

**Deliverable:** Users can set individual savings when creating cycles.

---

## M23: UI - Cycle Dashboard & Display
**Goal:** Display individual savings amounts in cycle views.

### Tasks

- [ ] **M23.1** Update admin cycle dashboard
  - File: `components/cycle/member-status-table.tsx` or similar
  - Add column: "Savings Amount"
  - Show: "150 KES (Custom)" or "100 KES (Default)"
  - Badge/indicator for custom vs default
  - **Privacy**: Admins always see actual amounts (even if member hid it)
  - Show "Hidden" indicator if member has privacy enabled (for transparency)

- [ ] **M23.2** Update member cycle view
  - File: `components/chama/member-view/cycle-summary.tsx`
  - Display member's savings amount for the cycle
  - Indicate if custom or default
  - Add toggle: "Hide my savings amount" (privacy setting)
  - Always show own savings to the member themselves

- [ ] **M23.3** Update cycle summary cards
  - Show total savings calculation
  - Breakdown by member (if admin view)

- [ ] **M23.4** Add edit savings option (before cycle starts)
  - Button: "Edit Savings" (only if cycle is pending)
  - Modal/form to update custom savings
  - Lock after cycle starts

**Deliverable:** Clear display of individual savings in all cycle views.

---

## M24: Edge Cases & Polish
**Goal:** Handle edge cases and finalize the feature.

### Tasks

- [ ] **M24.1** Handle existing cycles
  - Ensure existing `cycle_members` have NULL (use default)
  - No breaking changes to existing data

- [ ] **M24.2** Add restrictions
  - Lock savings amount changes after cycle starts
  - Prevent changes if cycle is 'active', 'paused', 'completed', or 'cancelled'
  - Only allow for 'pending' status
  - **Privacy setting** (`hide_savings`) can be changed anytime (not locked)

- [ ] **M24.3** Chama type validation
  - Only show option for 'savings' and 'hybrid' chamas
  - Hide for 'merry_go_round' chamas

- [ ] **M24.4** Add tooltips/help text
  - Explain what custom savings means
  - Show how it affects contribution split
  - Example calculations

- [ ] **M24.5** Update notifications
  - If savings amount changes, notify member
  - Include savings amount in contribution confirmation notifications

- [ ] **M24.6** Testing
  - Test with custom savings
  - Test with default savings (NULL)
  - Test validation (savings > contribution)
  - Test locking after cycle starts
  - Test for all chama types
  - Test privacy setting (hide savings)
  - Test that member always sees own savings
  - Test that other members see "Hidden" when privacy enabled
  - Test that admins see actual amounts (if Option A)

**Deliverable:** Feature complete, tested, and polished.

---

## Summary

| Milestone | Focus | Estimated Time |
|-----------|-------|----------------|
| **M19** | Database & Types | 1-2 hours |
| **M20** | Business Logic | 2-3 hours |
| **M21** | API Routes | 2-3 hours |
| **M22** | UI - Creation | 3-4 hours |
| **M23** | UI - Display | 2-3 hours |
| **M24** | Polish & Testing | 2-3 hours |
| **Total** | | **12-18 hours** |

---

## Implementation Order

1. **M19** - Foundation first (database, types)
2. **M20** - Core logic (contribution processing)
3. **M21** - API layer (endpoints)
4. **M22** - Creation UI (user can set savings)
5. **M23** - Display UI (user can see savings)
6. **M24** - Polish (edge cases, testing)

---

## Success Criteria

- ✅ Members can set custom savings when creating/joining cycles
- ✅ Custom savings is used when splitting contributions
- ✅ Default savings is used if custom is not set
- ✅ UI clearly shows custom vs default savings
- ✅ Validation prevents invalid savings amounts
- ✅ Works for Savings and Hybrid chamas only
- ✅ No breaking changes to existing cycles
- ✅ Savings amount locked after cycle starts
- ✅ Members can hide their savings from others (privacy)
- ✅ Members always see their own savings (even if hidden)
- ✅ Admins can see all savings amounts (for transparency)

---

## Notes

- **Backward Compatibility:** All existing cycles will use default savings (NULL = default)
- **Flexibility:** Members can have different savings in different cycles
- **Simplicity:** NULL handling makes it easy (NULL = use default)
- **Future:** Could add chama-level default savings preference later

