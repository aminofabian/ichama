# 🎯 Merry — Development Milestones

A granular task breakdown for building the Merry Chama platform from start to finish.

> **Note:** Phone OTP verification is required for signup. Email is optional and not used for authentication.

---

## 📊 Progress Overview

| Milestone | Tasks | Status |
|-----------|-------|--------|
| M0: Project Setup | 12 tasks | ⬜ Not Started |
| M1: Database & Types | 8 tasks | ⬜ Not Started |
| M2: Auth System (Phone OTP) | 15 tasks | ⬜ Not Started |
| M3: UI Foundation | 14 tasks | ⬜ Not Started |
| M4: Homepage | 8 tasks | ⬜ Not Started |
| M5: User Dashboard | 10 tasks | ⬜ Not Started |
| M6: Create Chama | 12 tasks | ⬜ Not Started |
| M7: Chama Views | 14 tasks | ⬜ Not Started |
| M8: Invite & Join | 10 tasks | ⬜ Not Started |
| M9: Create Cycle | 12 tasks | ⬜ Not Started |
| M10: Cycle Dashboard | 10 tasks | ⬜ Not Started |
| M11: Contributions | 12 tasks | ⬜ Not Started |
| M12: Payouts | 10 tasks | ⬜ Not Started |
| M13: Savings & Wallet | 10 tasks | ⬜ Not Started |
| M14: History Page | 6 tasks | ⬜ Not Started |
| M15: Notifications | 8 tasks | ⬜ Not Started |
| M16: Profile & Settings | 8 tasks | ⬜ Not Started |
| M17: Platform Admin | 12 tasks | ⬜ Not Started |
| M18: Polish & Deploy | 10 tasks | ⬜ Not Started |

**Total: ~181 tasks**

---

## M0: Project Setup
**Goal:** Get the development environment ready.

### Tasks

- [ ] **M0.1** Initialize Next.js 14 project with App Router
  ```bash
  pnpm create next-app@latest merry --typescript --tailwind --eslint --app --src-dir
  ```

- [ ] **M0.2** Configure `tsconfig.json` with strict mode and path aliases
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```

- [ ] **M0.3** Set up Prettier with config
  ```bash
  pnpm add -D prettier eslint-config-prettier
  ```
  Create `.prettierrc`:
  ```json
  {
    "semi": false,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
  }
  ```

- [ ] **M0.4** Configure ESLint rules (extend prettier)
  Update `.eslintrc.json`

- [ ] **M0.5** Install Turso client
  ```bash
  pnpm add @libsql/client
  ```

- [ ] **M0.6** Create `.env.example` with all required variables
  - Application URLs
  - Turso database credentials
  - Session secret
  - OTP settings
  - SMS configuration (SMS_SENDER_ID, SMS_PARTNER_ID, SMS_API_KEY, SMS_API_URL)
  - See `.env.example` file for complete list

- [ ] **M0.7** Create `.env.local` (gitignored) with actual values

- [ ] **M0.8** Set up Turso database
  ```bash
  turso db create merry-dev
  turso db tokens create merry-dev
  ```

- [ ] **M0.9** Create `src/lib/db/client.ts` — Turso connection singleton

- [ ] **M0.10** Create folder structure as per project structure document

- [ ] **M0.11** Add `pnpm` scripts for common tasks
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "format": "prettier --write .",
      "db:migrate": "tsx scripts/migrate.ts",
      "db:seed": "tsx scripts/seed.ts"
    }
  }
  ```

- [ ] **M0.12** Install essential dependencies
  ```bash
  pnpm add bcryptjs nanoid clsx tailwind-merge lucide-react
  pnpm add -D @types/bcryptjs tsx
  ```

**Deliverable:** Empty Next.js project with Turso connected, folder structure ready.

---

## M1: Database & Types
**Goal:** Create all database tables and TypeScript types.

### Tasks

- [ ] **M1.1** Create `src/lib/db/migrations/001_users.sql`
  - `users` table
  - `sessions` table
  - Indexes

- [ ] **M1.2** Create `src/lib/db/migrations/002_chamas.sql`
  - `chamas` table
  - `chama_members` table
  - `invitations` table
  - Indexes

- [ ] **M1.3** Create `src/lib/db/migrations/003_cycles.sql`
  - `cycles` table
  - `cycle_members` table
  - Indexes

- [ ] **M1.4** Create `src/lib/db/migrations/004_contributions.sql`
  - `contributions` table
  - `payouts` table
  - `defaults` table
  - Indexes

- [ ] **M1.5** Create `src/lib/db/migrations/005_financial.sql`
  - `savings_accounts` table
  - `savings_transactions` table
  - `wallet_transactions` table
  - Indexes

- [ ] **M1.6** Create `src/lib/db/migrations/006_platform.sql`
  - `notifications` table
  - `announcements` table
  - `audit_logs` table
  - `platform_settings` table
  - Default settings insert

- [ ] **M1.7** Create `scripts/migrate.ts` to run all migrations
  ```typescript
  // Read all .sql files from migrations folder
  // Execute them in order against Turso
  ```

- [ ] **M1.8** Create TypeScript types in `src/types/`
  - `user.ts` — User, Session types
  - `chama.ts` — Chama, ChamaMember, Invitation types
  - `cycle.ts` — Cycle, CycleMember types
  - `contribution.ts` — Contribution, Payout, Default types
  - `financial.ts` — SavingsAccount, WalletTransaction types
  - `notification.ts` — Notification, Announcement types
  - `api.ts` — API response types, error types

**Deliverable:** Database schema migrated, all types defined.

---

## M2: Auth System (Phone OTP)
**Goal:** Phone-only signup with OTP verification, password-based signin.

### Tasks

- [ ] **M2.1** Create `src/lib/auth/password.ts`
  - `hashPassword(password)` — bcrypt hash
  - `verifyPassword(password, hash)` — bcrypt compare

- [ ] **M2.2** Create `src/lib/auth/otp.ts`
  - `generateOTP()` — 6-digit random code
  - `hashOTP(code)` — hash for storage
  - `verifyOTP(code, hash)` — verify code
  - `OTP_EXPIRY_MINUTES` constant

- [ ] **M2.3** Create `src/lib/auth/sms.ts`
  - `sendOTP(phoneNumber, code)` — send SMS via API
  - Use SMS_API_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_PARTNER_ID
  - Handle API errors gracefully

- [ ] **M2.4** Create `src/lib/auth/session.ts`
  - `createSession(userId)` — generate token, store in DB, return
  - `getSession(token)` — fetch session from DB
  - `deleteSession(token)` — remove from DB
  - `SESSION_DURATION` constant (30 days)

- [ ] **M2.5** Create `src/lib/auth/cookies.ts`
  - `setSessionCookie(response, token)`
  - `getSessionCookie(request)`
  - `clearSessionCookie(response)`
  - Use secure, httpOnly, sameSite settings

- [ ] **M2.6** Create `src/lib/db/queries/users.ts`
  - `createUser({ fullName, phoneNumber, passwordHash })` — phone only, no email
  - `getUserByPhone(phoneNumber)`
  - `getUserById(id)`
  - `updateUser(id, data)`
  - `markPhoneVerified(userId)`

- [ ] **M2.7** Create `src/lib/db/queries/otp-codes.ts`
  - `createOTPCode(phoneNumber, codeHash, expiresAt)`
  - `getOTPCode(phoneNumber, purpose)` — get latest unverified
  - `verifyOTPCode(id)` — mark as verified
  - `incrementOTPAttempts(id)` — track attempts
  - `deleteExpiredOTPs()` — cleanup

- [ ] **M2.8** Create `src/lib/db/queries/sessions.ts`
  - `createSession(userId, tokenHash, expiresAt)`
  - `getSessionByToken(tokenHash)`
  - `deleteSession(id)`
  - `deleteUserSessions(userId)`

- [ ] **M2.9** Create `src/app/api/auth/otp/send/route.ts`
  - Validate phone number (Kenyan format)
  - Check rate limiting (max 3 per hour per phone)
  - Generate OTP code
  - Hash and store in DB
  - Send SMS via SMS service
  - Return success (don't return code)

- [ ] **M2.10** Create `src/app/api/auth/otp/verify/route.ts`
  - Validate phone and code
  - Get latest OTP for phone
  - Check expiry
  - Check attempts (max 3)
  - Verify code
  - Mark as verified
  - Return success with temp token (for signup flow)

- [ ] **M2.11** Create `src/app/api/auth/signup/route.ts`
  - Validate input (name, phone, password, otpToken)
  - Verify OTP token (from M2.10)
  - Check if phone already exists
  - Hash password
  - Create user with phone_verified_at
  - Create savings account
  - Create session
  - Set cookie
  - Return user data

- [ ] **M2.12** Create `src/app/api/auth/signin/route.ts`
  - Validate input (phone, password)
  - Get user by phone
  - Verify password
  - Create session
  - Set cookie
  - Return user data

- [ ] **M2.13** Create `src/app/api/auth/signout/route.ts`
  - Get session from cookie
  - Delete session from DB
  - Clear cookie
  - Return success

- [ ] **M2.14** Create `src/app/api/auth/session/route.ts` (GET)
  - Get session from cookie
  - Validate session
  - Return current user or 401

- [ ] **M2.15** Create `src/lib/auth/middleware.ts`
  - `getAuthUser(request)` — helper to get current user from session
  - `requireAuth(request)` — throws if not authenticated

**Deliverable:** Working phone OTP signup and password-based signin with session cookies.

---

## M3: UI Foundation
**Goal:** Build the core UI components and layouts.

### Tasks

- [ ] **M3.1** Configure Tailwind with custom theme in `tailwind.config.ts`
  - Colors (primary, secondary, accent)
  - Typography (font family)
  - Spacing scale
  - Border radius

- [ ] **M3.2** Create `src/lib/utils/cn.ts` — className merge utility
  ```typescript
  import { clsx, type ClassValue } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```

- [ ] **M3.3** Create `src/components/ui/button.tsx`
  - Variants: primary, secondary, outline, ghost, danger
  - Sizes: sm, md, lg
  - Loading state
  - Disabled state

- [ ] **M3.4** Create `src/components/ui/input.tsx`
  - Label support
  - Error state
  - Helper text
  - Icons (left/right)

- [ ] **M3.5** Create `src/components/ui/card.tsx`
  - Card, CardHeader, CardTitle, CardContent, CardFooter

- [ ] **M3.6** Create `src/components/ui/badge.tsx`
  - Variants: default, success, warning, error, info

- [ ] **M3.7** Create `src/components/ui/avatar.tsx`
  - Image with fallback (initials)
  - Sizes: sm, md, lg

- [ ] **M3.8** Create `src/components/ui/modal.tsx`
  - Dialog with overlay
  - Close button
  - Title and description

- [ ] **M3.9** Create `src/components/ui/toast.tsx`
  - Toast container
  - Toast variants (success, error, info)
  - Auto-dismiss

- [ ] **M3.10** Create `src/components/shared/loading-spinner.tsx`
  - Spinner animation
  - Sizes

- [ ] **M3.11** Create `src/components/shared/empty-state.tsx`
  - Icon
  - Title
  - Description
  - Action button

- [ ] **M3.12** Create `src/components/layout/header.tsx`
  - Logo
  - Navigation links
  - User menu (when logged in)
  - Mobile menu toggle

- [ ] **M3.13** Create `src/components/layout/sidebar.tsx`
  - Navigation items
  - Active state
  - Collapsed state (mobile)
  - User info at bottom

- [ ] **M3.14** Create `src/components/layout/mobile-nav.tsx`
  - Bottom navigation for mobile
  - Icon + label
  - Active state

**Deliverable:** Reusable component library ready for pages.

---

## M4: Homepage
**Goal:** Build the public landing page.

### Tasks

- [ ] **M4.1** Create `src/app/page.tsx` — Homepage structure

- [ ] **M4.2** Create `src/components/home/hero-section.tsx`
  - Headline
  - Subheadline
  - CTA buttons (Create Chama, Join Chama)
  - Illustration or image

- [ ] **M4.3** Create `src/components/home/features-section.tsx`
  - 3 chama types explained
  - Icons for each
  - Brief descriptions

- [ ] **M4.4** Create `src/components/home/how-it-works.tsx`
  - 4-step process
  - Step numbers
  - Icons
  - Descriptions

- [ ] **M4.5** Create `src/components/home/example-breakdown.tsx`
  - Visual breakdown of KES 330
  - Payout, Savings, Fee split
  - Animated or interactive

- [ ] **M4.6** Create `src/components/home/trust-signals.tsx`
  - Transparency
  - Automatic tracking
  - Complete history
  - Icons/illustrations

- [ ] **M4.7** Create `src/components/layout/footer.tsx`
  - Logo
  - Links (About, Contact, Terms, Privacy)
  - Copyright

- [ ] **M4.8** Create `src/app/(public)/layout.tsx`
  - Header (public version)
  - Footer
  - Children

**Deliverable:** Beautiful landing page explaining Merry.

---

## M5: User Dashboard
**Goal:** Build the main user dashboard after login.

### Tasks

- [ ] **M5.1** Create `src/app/(dashboard)/layout.tsx`
  - Sidebar
  - Header (with user info)
  - Mobile nav
  - Auth check (redirect if not logged in)

- [ ] **M5.2** Create `src/app/(dashboard)/dashboard/page.tsx`
  - Page structure
  - Fetch dashboard data

- [ ] **M5.3** Create `src/app/api/user/dashboard/route.ts`
  - Get user's chamas (with role)
  - Get total contributions
  - Get savings balance
  - Get upcoming payout (if any)

- [ ] **M5.4** Create `src/lib/db/queries/chamas.ts`
  - `getUserChamas(userId)` — list chamas with member info
  - `getChamaById(id)`
  - `createChama(data)`
  - `updateChama(id, data)`

- [ ] **M5.5** Create `src/components/dashboard/summary-cards.tsx`
  - Active chamas count
  - Total contributed
  - Savings balance
  - Upcoming payout
  - Each as a Card with icon

- [ ] **M5.6** Create `src/components/dashboard/chama-list.tsx`
  - List of chama cards
  - Empty state if no chamas
  - Loading state

- [ ] **M5.7** Create `src/components/dashboard/chama-card.tsx`
  - Chama name
  - Type badge
  - Status badge
  - Your role
  - Quick stats (members, cycle status)
  - Click to view

- [ ] **M5.8** Create `src/lib/utils/format.ts`
  - `formatCurrency(amount)` — KES formatting
  - `formatDate(date)` — locale date
  - `formatRelativeTime(date)` — "2 days ago"
  - `formatPhone(phone)` — display format

- [ ] **M5.9** Create `src/lib/hooks/use-user.ts`
  - Fetch current user
  - Loading/error states
  - Refetch function

- [ ] **M5.10** Create empty state component for dashboard
  - "No chamas yet"
  - CTA to create or join

**Deliverable:** Dashboard showing user's chamas and summary stats.

---

## M6: Create Chama (Wizard)
**Goal:** Multi-step form to create a new chama.

### Tasks

- [ ] **M6.1** Create `src/app/(dashboard)/chamas/new/page.tsx`
  - Wizard container
  - Step indicator
  - Navigation (back/next)

- [ ] **M6.2** Create `src/components/chama/create-wizard/step-indicator.tsx`
  - Step numbers
  - Step labels
  - Current step highlight
  - Completed steps

- [ ] **M6.3** Create `src/components/chama/create-wizard/step-basic-info.tsx`
  - Chama name input
  - Description textarea
  - Privacy toggle (public/private)

- [ ] **M6.4** Create `src/components/chama/create-wizard/step-chama-type.tsx`
  - 3 type cards (Savings, Merry-go-round, Hybrid)
  - Description for each
  - Selection state

- [ ] **M6.5** Create `src/components/chama/create-wizard/step-contribution-rules.tsx`
  - Contribution amount input
  - Auto-calculate breakdown (or manual)
  - Payout amount
  - Savings amount
  - Service fee
  - Frequency selector

- [ ] **M6.6** Create `src/components/chama/create-wizard/step-review.tsx`
  - Summary of all inputs
  - Edit buttons for each section
  - Create button

- [ ] **M6.7** Create `src/lib/utils/validation.ts`
  - `validateChamaName(name)`
  - `validateContributionAmount(amount)`
  - `validatePhone(phone)`
  - Generic validators

- [ ] **M6.8** Create `src/lib/utils/invite-code.ts`
  - `generateInviteCode()` — short unique code
  - Use nanoid

- [ ] **M6.9** Create `src/app/api/chamas/route.ts` (POST)
  - Validate input
  - Generate invite code
  - Create chama
  - Add creator as admin member
  - Create savings account for user (if not exists)
  - Return chama with invite link

- [ ] **M6.10** Create `src/lib/db/queries/chama-members.ts`
  - `addChamaMember(chamaId, userId, role)`
  - `getChamaMembers(chamaId)`
  - `getChamaMember(chamaId, userId)`
  - `updateChamaMember(id, data)`
  - `removeChamaMember(id)`

- [ ] **M6.11** Add redirect after chama creation
  - Redirect to chama admin dashboard
  - Show success toast

- [ ] **M6.12** Create form state management hook
  - `useCreateChamaForm()` — manages wizard state

**Deliverable:** Working wizard to create new chamas.

---

## M7: Chama Views (Member & Admin)
**Goal:** Build chama dashboard for members and admins.

### Tasks

- [ ] **M7.1** Create `src/app/(dashboard)/chamas/[id]/page.tsx`
  - Fetch chama data
  - Check user role
  - Render member or admin view

- [ ] **M7.2** Create `src/app/api/chamas/[id]/route.ts` (GET)
  - Get chama by ID
  - Include members
  - Include active cycle
  - Include user's role

- [ ] **M7.3** Create `src/components/chama/chama-header.tsx`
  - Chama name
  - Type badge
  - Status
  - Member count
  - Settings button (admin only)

- [ ] **M7.4** Create `src/components/chama/member-view/index.tsx`
  - Cycle info (if active)
  - Your turn/position
  - Contribution status
  - Quick actions

- [ ] **M7.5** Create `src/components/chama/member-view/cycle-summary.tsx`
  - Current period
  - Your contribution status
  - Next due date
  - Payout info

- [ ] **M7.6** Create `src/components/chama/member-view/member-position.tsx`
  - Your number in cycle
  - When you'll receive payout
  - Visual position indicator

- [ ] **M7.7** Create `src/components/chama/admin-view/index.tsx`
  - Admin controls
  - Cycle management
  - Member management
  - Analytics

- [ ] **M7.8** Create `src/components/chama/admin-view/admin-actions.tsx`
  - Start new cycle button
  - Invite members button
  - Manage members button
  - Settings button

- [ ] **M7.9** Create `src/components/chama/admin-view/quick-stats.tsx`
  - Total members
  - Active cycle status
  - Collection rate
  - Savings pot

- [ ] **M7.10** Create `src/components/chama/member-list.tsx`
  - List of members
  - Role badge
  - Status badge
  - Admin actions (if admin)

- [ ] **M7.11** Create `src/app/(dashboard)/chamas/[id]/members/page.tsx`
  - Full members page
  - Search/filter
  - Admin actions

- [ ] **M7.12** Create `src/app/api/chamas/[id]/members/route.ts`
  - GET: list members
  - POST: add member (admin)
  - DELETE: remove member (admin)

- [ ] **M7.13** Create member removal flow
  - Confirm dialog
  - API call
  - Update UI

- [ ] **M7.14** Create chama settings page (admin only)
  - `src/app/(dashboard)/chamas/[id]/settings/page.tsx`
  - Update name, description, privacy
  - Danger zone (close chama)

**Deliverable:** Complete chama views for members and admins.

---

## M8: Invite & Join Flow
**Goal:** Allow admins to invite and users to join chamas.

### Tasks

- [ ] **M8.1** Create `src/components/chama/invite-modal.tsx`
  - Share link
  - Copy button
  - Generate new link option

- [ ] **M8.2** Create `src/app/api/chamas/[id]/invite/route.ts`
  - POST: generate invitation
  - Store in invitations table
  - Return invite link

- [ ] **M8.3** Create `src/lib/db/queries/invitations.ts`
  - `createInvitation(chamaId, invitedBy, expiresAt)`
  - `getInvitationByCode(code)`
  - `acceptInvitation(id, userId)`
  - `expireInvitation(id)`

- [ ] **M8.4** Create `src/app/(public)/join/[code]/page.tsx`
  - Public invite page
  - Fetch invite details
  - Show chama info
  - Login/signup prompts

- [ ] **M8.5** Create `src/app/api/chamas/join/[code]/route.ts`
  - GET: get invite details (public)
  - POST: accept invite (auth required)

- [ ] **M8.6** Create `src/components/invite/invite-preview.tsx`
  - Chama name & description
  - Type
  - Member count
  - Admin name
  - Join button

- [ ] **M8.7** Handle join flow for logged-in users
  - Show accept button
  - Add to chama_members on accept
  - Redirect to chama

- [ ] **M8.8** Handle join flow for new users
  - Show signup form
  - After signup, auto-join
  - Redirect to chama

- [ ] **M8.9** Handle expired/invalid invites
  - Show error state
  - Suggest contacting admin

- [ ] **M8.10** Add invite success notification
  - Notify chama admin
  - Show in notifications

**Deliverable:** Complete invite/join flow with public invite pages.

---

## M9: Create Cycle
**Goal:** Allow admins to create and configure cycles.

### Tasks

- [ ] **M9.1** Create `src/app/(dashboard)/chamas/[id]/cycles/new/page.tsx`
  - Cycle creation form
  - Member selection
  - Turn assignment

- [ ] **M9.2** Create `src/components/cycle/create-cycle-form.tsx`
  - Cycle name
  - Contribution amount
  - Breakdown (payout, savings, fee)
  - Frequency
  - Start date

- [ ] **M9.3** Create `src/components/cycle/member-selector.tsx`
  - List of chama members
  - Checkbox selection
  - Select all/none

- [ ] **M9.4** Create `src/components/cycle/turn-assignment.tsx`
  - Drag and drop ordering
  - Random shuffle button
  - Manual number input

- [ ] **M9.5** Create `src/lib/db/queries/cycles.ts`
  - `createCycle(data)`
  - `getCycleById(id)`
  - `getChamasCycles(chamaId)`
  - `updateCycle(id, data)`
  - `getActiveCycle(chamaId)`

- [ ] **M9.6** Create `src/lib/db/queries/cycle-members.ts`
  - `addCycleMembers(cycleId, members[])`
  - `getCycleMembers(cycleId)`
  - `updateCycleMember(id, data)`
  - `shuffleTurnOrder(cycleId)`

- [ ] **M9.7** Create `src/app/api/chamas/[id]/cycles/route.ts`
  - GET: list cycles
  - POST: create cycle with members

- [ ] **M9.8** Create cycle creation logic
  - Validate inputs
  - Create cycle record
  - Add cycle members with turn order
  - Create contribution records for period 1
  - Create payout record for period 1 recipient

- [ ] **M9.9** Create `src/lib/services/cycle-service.ts`
  - `initializeCycle(cycleId)` — set up contributions/payouts
  - `startCycle(cycleId)` — activate cycle
  - `advancePeriod(cycleId)` — move to next period

- [ ] **M9.10** Create `src/app/api/cycles/[id]/route.ts`
  - GET: cycle details
  - PATCH: update cycle (start, pause, end)

- [ ] **M9.11** Create start cycle confirmation
  - Review all settings
  - Confirm start
  - Set status to active

- [ ] **M9.12** Add notifications for cycle start
  - Notify all cycle members
  - Include first contribution due date

**Deliverable:** Admins can create and start cycles.

---

## M10: Cycle Dashboard
**Goal:** Display cycle progress and member status.

### Tasks

- [ ] **M10.1** Create `src/app/(dashboard)/chamas/[id]/cycles/[cycleId]/page.tsx`
  - Cycle dashboard
  - Period progress
  - Member status

- [ ] **M10.2** Create `src/app/api/cycles/[id]/route.ts` (GET)
  - Cycle details
  - Members with contribution status
  - Current period info
  - Payout schedule

- [ ] **M10.3** Create `src/components/cycle/period-tracker.tsx`
  - Visual progress bar
  - Current period highlight
  - Clickable periods

- [ ] **M10.4** Create `src/components/cycle/member-status-table.tsx`
  - Member name
  - Turn number
  - Contribution status per period
  - Payout status
  - Admin actions

- [ ] **M10.5** Create `src/components/cycle/cycle-summary.tsx`
  - Total collected
  - Collection rate
  - Next payout recipient
  - Days until next period

- [ ] **M10.6** Create `src/components/cycle/payout-recipient.tsx`
  - Current period recipient
  - Amount
  - Status
  - Confirm payout button (admin)

- [ ] **M10.7** Create admin controls for cycle
  - Advance to next period
  - Pause cycle
  - End cycle

- [ ] **M10.8** Create `src/app/api/cycles/[id]/advance/route.ts`
  - Advance to next period
  - Create contribution records for new period
  - Update payout schedule

- [ ] **M10.9** Create period history view
  - Past periods with status
  - Contribution summary
  - Payout info

- [ ] **M10.10** Create cycle completion flow
  - End cycle
  - Update all statuses
  - Show completion summary

**Deliverable:** Cycle dashboard with progress tracking.

---

## M11: Contributions
**Goal:** Record, track, and confirm member contributions.

### Tasks

- [ ] **M11.1** Create `src/lib/db/queries/contributions.ts`
  - `createContributions(cycleId, periodNumber, members[])`
  - `getContributionsByCycle(cycleId)`
  - `getContributionsByMember(cycleMemberId)`
  - `getContributionById(id)`
  - `updateContribution(id, data)`
  - `getPendingContributions(cycleId, periodNumber)`

- [ ] **M11.2** Create `src/app/api/cycles/[id]/contributions/route.ts`
  - GET: list all contributions
  - POST: record contribution (member submits)

- [ ] **M11.3** Create `src/app/api/contributions/[id]/route.ts`
  - GET: contribution details
  - PATCH: update contribution

- [ ] **M11.4** Create `src/app/api/contributions/[id]/confirm/route.ts`
  - POST: admin confirms contribution
  - Update status
  - Create wallet transaction
  - Credit savings if applicable

- [ ] **M11.5** Create `src/components/cycle/contribution-form.tsx`
  - Amount input
  - Date of payment
  - Notes
  - Submit button

- [ ] **M11.6** Create `src/components/cycle/contribution-table.tsx`
  - All contributions for period
  - Status badges
  - Confirm buttons (admin)
  - Filter by status

- [ ] **M11.7** Create `src/components/cycle/my-contribution-card.tsx`
  - Your contribution status
  - Amount due
  - Due date
  - Pay button / Paid status

- [ ] **M11.8** Create contribution status update logic
  - Mark as paid (member)
  - Confirm paid (admin)
  - Mark as late (system)
  - Mark as missed (system)

- [ ] **M11.9** Create `src/lib/services/contribution-service.ts`
  - `recordContribution(contributionId, data)`
  - `confirmContribution(contributionId, adminId)`
  - `processContributionConfirmation(contribution)`

- [ ] **M11.10** Handle savings split on contribution
  - Calculate savings amount
  - Credit savings account
  - Create savings transaction

- [ ] **M11.11** Create wallet transaction on contribution
  - Record in wallet_transactions
  - Link to contribution

- [ ] **M11.12** Add notifications for contributions
  - Reminder before due date
  - Confirmation after payment
  - Alert for late/missed

**Deliverable:** Complete contribution recording and tracking.

---

## M12: Payouts
**Goal:** Schedule, process, and confirm payouts.

### Tasks

- [ ] **M12.1** Create `src/lib/db/queries/payouts.ts`
  - `createPayout(data)`
  - `getPayoutsByCycle(cycleId)`
  - `getPayoutById(id)`
  - `updatePayout(id, data)`
  - `getScheduledPayouts(cycleId)`
  - `getMemberPayouts(userId)`

- [ ] **M12.2** Create `src/app/api/cycles/[id]/payouts/route.ts`
  - GET: list payouts for cycle

- [ ] **M12.3** Create `src/app/api/payouts/[id]/route.ts`
  - GET: payout details

- [ ] **M12.4** Create `src/app/api/payouts/[id]/send/route.ts`
  - POST: admin marks payout as sent
  - Update status to 'paid'
  - Record paid_at timestamp

- [ ] **M12.5** Create `src/app/api/payouts/[id]/confirm/route.ts`
  - POST: member confirms receipt
  - Update confirmed_by_member
  - Record confirmed_at

- [ ] **M12.6** Create `src/components/cycle/payout-schedule.tsx`
  - All scheduled payouts
  - Recipient, amount, date
  - Status badges

- [ ] **M12.7** Create `src/components/cycle/payout-card.tsx`
  - Current payout details
  - Send button (admin)
  - Confirm button (recipient)

- [ ] **M12.8** Create `src/lib/services/payout-service.ts`
  - `schedulePayout(cycleId, cycleMemberId, periodNumber)`
  - `processPayout(payoutId)`
  - `confirmPayoutReceipt(payoutId, userId)`

- [ ] **M12.9** Create wallet transaction on payout
  - Record in wallet_transactions
  - Type: payout
  - Direction: in (for recipient)

- [ ] **M12.10** Add notifications for payouts
  - Notify recipient when scheduled
  - Notify when sent
  - Confirm receipt reminder

**Deliverable:** Complete payout scheduling and confirmation.

---

## M13: Savings & Wallet
**Goal:** Track savings balances and all financial transactions.

### Tasks

- [ ] **M13.1** Create `src/lib/db/queries/savings.ts`
  - `createSavingsAccount(userId)`
  - `getSavingsAccount(userId)`
  - `updateSavingsBalance(accountId, amount)`
  - `getSavingsTransactions(userId)`

- [ ] **M13.2** Create `src/lib/db/queries/wallet.ts`
  - `createWalletTransaction(data)`
  - `getWalletTransactions(userId, filters)`
  - `getWalletBalance(userId)` — calculated from transactions

- [ ] **M13.3** Create `src/app/api/savings/route.ts`
  - GET: savings account with balance
  - GET: savings transactions

- [ ] **M13.4** Create `src/app/api/wallet/route.ts`
  - GET: wallet transactions
  - Support filters (type, date, chama)

- [ ] **M13.5** Create `src/app/(dashboard)/wallet/page.tsx`
  - Savings balance card
  - Transaction list
  - Filters

- [ ] **M13.6** Create `src/components/wallet/savings-card.tsx`
  - Current balance
  - Recent transactions preview

- [ ] **M13.7** Create `src/components/wallet/transaction-list.tsx`
  - List of transactions
  - Type icons
  - Amount (+/-)
  - Date
  - Chama reference

- [ ] **M13.8** Create `src/components/wallet/transaction-filters.tsx`
  - Type filter
  - Date range
  - Chama filter

- [ ] **M13.9** Create `src/lib/services/savings-service.ts`
  - `creditSavings(userId, amount, cycleId, reason)`
  - `debitSavings(userId, amount, reason)`

- [ ] **M13.10** Create CSV export for transactions
  - Export button
  - Generate CSV
  - Download

**Deliverable:** Savings balance and wallet transaction history.

---

## M14: History Page
**Goal:** Complete historical records for transparency.

### Tasks

- [ ] **M14.1** Create `src/app/(dashboard)/history/page.tsx`
  - Tabs: Chamas, Cycles, Contributions, Payouts
  - Filters
  - List views

- [ ] **M14.2** Create `src/app/api/user/history/route.ts`
  - GET: all historical data
  - Support filters and pagination

- [ ] **M14.3** Create `src/components/history/chama-history.tsx`
  - Past chamas
  - Status
  - Duration
  - Total contributed

- [ ] **M14.4** Create `src/components/history/contribution-history.tsx`
  - All past contributions
  - Status, amount, date
  - Chama/cycle reference

- [ ] **M14.5** Create `src/components/history/payout-history.tsx`
  - All payouts received
  - Amount, date
  - Chama/cycle reference

- [ ] **M14.6** Create history filters component
  - Date range
  - Chama filter
  - Status filter

**Deliverable:** Complete history page with all records.

---

## M15: Notifications
**Goal:** In-app notification system.

### Tasks

- [ ] **M15.1** Create `src/lib/db/queries/notifications.ts`
  - `createNotification(data)`
  - `getUserNotifications(userId, limit)`
  - `getUnreadCount(userId)`
  - `markAsRead(id)`
  - `markAllAsRead(userId)`

- [ ] **M15.2** Create `src/lib/services/notification-service.ts`
  - `notifyUser(userId, type, data)`
  - `notifyChamaMembers(chamaId, type, data)`
  - Type-specific message templates

- [ ] **M15.3** Create `src/app/api/notifications/route.ts`
  - GET: list notifications
  - POST: mark all as read

- [ ] **M15.4** Create `src/app/api/notifications/[id]/read/route.ts`
  - PATCH: mark single as read

- [ ] **M15.5** Create `src/app/(dashboard)/notifications/page.tsx`
  - Notification list
  - Mark as read actions
  - Click to navigate

- [ ] **M15.6** Create `src/components/notifications/notification-list.tsx`
  - Grouped by date
  - Unread indicator
  - Type icon

- [ ] **M15.7** Create `src/components/notifications/notification-bell.tsx`
  - Bell icon in header
  - Unread count badge
  - Dropdown preview

- [ ] **M15.8** Add notifications to all relevant actions
  - Contribution reminders
  - Payout notifications
  - Member joined
  - Cycle started/ended

**Deliverable:** Working in-app notification system.

---

## M16: Profile & Settings
**Goal:** User profile management.

### Tasks

- [ ] **M16.1** Create `src/app/(dashboard)/profile/page.tsx`
  - Profile view
  - Edit mode
  - Settings sections

- [ ] **M16.2** Create `src/app/api/user/me/route.ts`
  - GET: current user profile
  - PATCH: update profile

- [ ] **M16.3** Create `src/components/profile/profile-form.tsx`
  - Full name
  - Phone (read-only for now)
  - Email
  - Avatar upload (later)

- [ ] **M16.4** Create `src/components/profile/change-password.tsx`
  - Current password
  - New password
  - Confirm password

- [ ] **M16.5** Create `src/app/api/user/password/route.ts`
  - POST: change password
  - Verify current password
  - Update password hash

- [ ] **M16.6** Create `src/components/profile/notification-prefs.tsx`
  - Email notifications toggle
  - SMS notifications toggle (later)
  - Push notifications toggle (later)

- [ ] **M16.7** Create `src/components/profile/danger-zone.tsx`
  - Delete account button
  - Confirmation modal

- [ ] **M16.8** Create account deletion flow
  - Verify password
  - Soft delete (set status)
  - Clear sessions

**Deliverable:** Profile management with password change.

---

## M17: Platform Admin
**Goal:** Super admin dashboard for platform management.

### Tasks

- [ ] **M17.1** Create admin role check middleware
  - Check if user is super_admin
  - Redirect if not authorized

- [ ] **M17.2** Create `src/app/admin/layout.tsx`
  - Admin sidebar
  - Admin header
  - Role check

- [ ] **M17.3** Create `src/app/admin/dashboard/page.tsx`
  - Platform stats
  - Recent activity

- [ ] **M17.4** Create `src/app/api/admin/dashboard/route.ts`
  - Total users
  - Total chamas
  - Active cycles
  - Revenue (service fees)

- [ ] **M17.5** Create `src/app/admin/users/page.tsx`
  - User list
  - Search
  - Filters

- [ ] **M17.6** Create `src/app/api/admin/users/route.ts`
  - GET: list users with pagination
  - Support search and filters

- [ ] **M17.7** Create `src/app/api/admin/users/[id]/route.ts`
  - GET: user details
  - PATCH: update user (suspend/activate)

- [ ] **M17.8** Create `src/app/admin/chamas/page.tsx`
  - All chamas list
  - Stats per chama

- [ ] **M17.9** Create `src/app/api/admin/chamas/route.ts`
  - GET: list all chamas

- [ ] **M17.10** Create `src/app/admin/settings/page.tsx`
  - Platform settings
  - Edit form

- [ ] **M17.11** Create `src/app/api/admin/settings/route.ts`
  - GET: all settings
  - PATCH: update settings

- [ ] **M17.12** Create audit log viewer
  - `src/app/admin/audit/page.tsx`
  - Filter by actor, action, entity
  - Date range

**Deliverable:** Platform admin dashboard with user/chama management.

---

## M18: Polish & Deploy
**Goal:** Final polish, testing, and deployment.

### Tasks

- [ ] **M18.1** Add loading states to all pages
  - Skeleton loaders
  - Spinners

- [ ] **M18.2** Add error handling to all pages
  - Error boundaries
  - Friendly error messages
  - Retry actions

- [ ] **M18.3** Add 404 and error pages
  - `src/app/not-found.tsx`
  - `src/app/error.tsx`

- [ ] **M18.4** Mobile responsiveness audit
  - Test all pages on mobile
  - Fix layout issues
  - Optimize touch targets

- [ ] **M18.5** Performance optimization
  - Image optimization
  - Code splitting
  - Lazy loading

- [ ] **M18.6** SEO basics
  - Meta tags
  - Open Graph
  - Sitemap

- [ ] **M18.7** Create seed script for demo data
  - Sample users
  - Sample chamas
  - Sample cycles with contributions

- [ ] **M18.8** Set up deployment
  - Vercel project
  - Environment variables
  - Turso production database

- [ ] **M18.9** Set up monitoring
  - Error tracking (Sentry)
  - Analytics (Vercel Analytics)

- [ ] **M18.10** Final testing and launch
  - End-to-end testing
  - Fix bugs
  - Launch 🚀

**Deliverable:** Production-ready application deployed and live.

---

## 📅 Estimated Timeline

| Phase | Milestones | Duration |
|-------|------------|----------|
| **Week 1** | M0, M1, M2 | Setup, DB, Auth |
| **Week 2** | M3, M4 | UI Components, Homepage |
| **Week 3** | M5, M6 | Dashboard, Create Chama |
| **Week 4** | M7, M8 | Chama Views, Invite/Join |
| **Week 5** | M9, M10 | Create Cycle, Cycle Dashboard |
| **Week 6** | M11, M12 | Contributions, Payouts |
| **Week 7** | M13, M14 | Savings/Wallet, History |
| **Week 8** | M15, M16 | Notifications, Profile |
| **Week 9** | M17 | Platform Admin |
| **Week 10** | M18 | Polish & Deploy |

---

## 🔮 Deferred to Later

The following features are intentionally deferred:

1. **Email Notifications** — SMTP integration for general notifications
2. **SMS Notifications** — SMS for non-OTP notifications (reminders, alerts)
3. **Payment Integration** — M-Pesa STK Push
4. **Trust/Rating System** — Automatic score calculation
5. **Disputes** — Dispute creation and resolution
6. **Announcements** — Chama announcements
7. **File Uploads** — Avatar, receipts
8. **PWA Features** — Offline support, push notifications
9. **Mobile App** — React Native

**Note:** Phone OTP for signup is included in M2. SMS service is used for OTP only.

---

## ✅ How to Use This Document

1. **Work milestone by milestone** — Complete all tasks in a milestone before moving on
2. **Check off tasks** — Update this document as you complete tasks
3. **Track blockers** — Note any blockers or dependencies
4. **Adjust estimates** — Update timeline as needed
5. **Celebrate wins** — Each milestone is a mini-launch! 🎉

---

**Let's build Merry!** 🚀

