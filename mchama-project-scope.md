# 🎉 Merry — Chama Management Platform

A modern platform for managing **Chamas** (traditional Kenyan savings groups) with support for Savings, Merry-go-round, and Hybrid models.

> **Tech Stack:** Next.js 14+ (App Router) · Turso (libSQL) · Raw SQL · TypeScript

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Platform Flow](#platform-flow)
4. [Features by Role](#features-by-role)
5. [Page Specifications](#page-specifications)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Background Jobs](#background-jobs)
9. [Project Structure](#project-structure)
10. [Development Phases](#development-phases)
11. [Getting Started](#getting-started)
12. [Environment Variables](#environment-variables)
13. [Security Considerations](#security-considerations)
14. [Future Roadmap](#future-roadmap)

---

## Overview

### What is a Chama?

A **Chama** is a traditional informal savings group popular in Kenya where members:

- Contribute a fixed amount regularly (weekly/monthly)
- Pool funds together
- Distribute to members on a rotating basis (merry-go-round) or save collectively

### Platform Purpose

Merry digitizes the Chama experience by providing:

- ✅ Transparent contribution tracking
- ✅ Automated payout scheduling
- ✅ Member trust ratings
- ✅ Complete financial history
- ✅ Mobile-first design for Kenyan users

### Business Model

```
Contribution = Payout Amount + Savings Amount + Service Fee

Example: KES 330 contribution
├── Payout:  KES 300 (goes to recipient)
├── Savings: KES 20  (member's savings account)
└── Fee:     KES 10  (platform revenue)
```

---

## Core Concepts

### Chama Types

| Type | Description |
|------|-------------|
| **Savings** | Members contribute to build savings. No rotating payouts. |
| **Merry-go-round** | Pooled contributions go to one member per period, rotating through all members. |
| **Hybrid** | Combination of both — partial payout + partial savings each period. |

### Key Entities

```
CHAMA (Container)
  └── CYCLE (Money Engine)
        ├── CYCLE_MEMBERS (Participants + Turn Order)
        ├── CONTRIBUTIONS (What members pay)
        └── PAYOUTS (What members receive)
```

### Important Design Decisions

1. **Chamas are containers** — No financial logic at chama level
2. **Cycles isolate rules** — Contribution amounts locked per cycle
3. **Members can skip cycles** — Different participants each cycle
4. **Ratings are immutable** — Based on behavior events, never manually edited
5. **Wallet = Source of Truth** — All money movement tracked centrally

---

## Platform Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE                                 │
│         What is Chama? · How it Works · Trust Signals           │
└─────────────────────┬───────────────────┬───────────────────────┘
                      │                   │
                      ▼                   ▼
              ┌───────────┐       ┌───────────┐
              │  SIGN UP  │       │  SIGN IN  │
              │  (OTP)    │       │  (OTP)    │
              └─────┬─────┘       └─────┬─────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    ┌─────────────────┐
                    │  USER DASHBOARD │
                    │  (Main Hub)     │
                    └────┬───────┬────┘
                         │       │
            ┌────────────┘       └────────────┐
            ▼                                 ▼
    ┌───────────────┐                 ┌───────────────┐
    │ CREATE CHAMA  │                 │  JOIN CHAMA   │
    │ (Wizard)      │                 │  (Invite)     │
    └───────┬───────┘                 └───────┬───────┘
            │                                 │
            ▼                                 ▼
    ┌───────────────┐                 ┌───────────────┐
    │ ADMIN DASH    │                 │ MEMBER VIEW   │
    │ (Manage)      │◄────────────────│ (Participate) │
    └───────┬───────┘                 └───────┬───────┘
            │                                 │
            └─────────────┬───────────────────┘
                          ▼
                  ┌───────────────┐
                  │  CYCLE PAGE   │
                  │  (Active)     │
                  └───────┬───────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ HISTORY  │   │  WALLET  │   │ PROFILE  │
    └──────────┘   └──────────┘   └──────────┘
```

---

## Features by Role

### 👤 Member

| Feature | Description |
|---------|-------------|
| View Dashboard | See active chamas, contributions, payouts |
| Join Chama | Via invite link or code |
| View Cycle | See turn order, contribution status |
| Record Contribution | Mark as paid (admin confirms) |
| Confirm Payout | Acknowledge receipt of funds |
| View History | Past contributions and payouts |
| Manage Profile | Update details, security settings |

### 👑 Chama Admin

| Feature | Description |
|---------|-------------|
| Create Chama | Set up new group with rules |
| Invite Members | Generate invite links/codes |
| Create Cycles | Define contribution rules |
| Assign Turns | Manual or random turn order |
| Approve Contributions | Confirm member payments |
| Trigger Payouts | Mark payouts as sent |
| Manage Members | Remove or suspend members |
| Handle Defaults | Record missed payments |
| View Analytics | Contribution rates, collection totals |

### 🛡️ Platform Admin (Super Admin)

| Feature | Description |
|---------|-------------|
| View All Chamas | Platform-wide overview |
| User Management | Suspend/activate users |
| Revenue Tracking | Service fee collection |
| Dispute Resolution | Handle escalated issues |
| System Settings | Configure platform defaults |
| Audit Logs | Review all system actions |

---

## Page Specifications

### 1️⃣ Homepage

**Purpose:** Explain what this is and push users to sign up.

**Sections:**
- Hero with value proposition
- What is a Chama (3 types explained)
- How it works (4 steps)
- Example breakdown (KES 330 → payout + savings + fee)
- Trust signals (transparency, tracking, history)
- CTA buttons: Create Chama, Join Chama, Sign In

**Actions:**
- Navigate to Sign Up
- Navigate to Sign In

---

### 2️⃣ Sign Up

**Purpose:** Create a new user account.

**Form Fields:**
- Full name (required)
- Phone number (required, Kenyan format)
- Email (optional)
- Password (min 8 chars)
- Terms acceptance checkbox

**Flow:**
1. Submit form
2. Send OTP to phone
3. Verify OTP
4. Create account
5. Redirect to Dashboard

---

### 3️⃣ Sign In

**Purpose:** Authenticate returning users.

**Options:**
- Phone/Email + Password
- OTP-only login
- Forgot password link

**Flow:**
1. Enter credentials
2. Validate
3. Create session
4. Redirect to Dashboard

---

### 4️⃣ User Dashboard

**Purpose:** Central control panel for everything.

**Components:**
- Summary cards:
  - Active chamas count
  - Total contributed (all time)
  - Total savings balance
  - Upcoming payout (next in line)
- Chama list:
  - Name, type, status
  - Your role (Admin/Member)
  - Quick actions (View, Contribute)
- Empty state for new users

**Actions:**
- Create New Chama
- View Chama
- View Notifications

---

### 5️⃣ Create Chama (Wizard)

**Purpose:** Guide admin through chama creation step-by-step.

**Step 1: Basic Info**
- Chama name
- Description
- Privacy (Public/Private)

**Step 2: Chama Type**
- Savings only
- Merry-go-round only
- Hybrid

**Step 3: Contribution Rules** (Optional - can set during cycle)
- Contribution amount
- Breakdown (payout, savings, fee)
- Frequency (weekly/monthly)

**Step 4: Review & Create**
- Summary of all settings
- Confirm button

**After Success:**
- Redirect to Chama Admin Dashboard
- Show invite link

---

### 6️⃣ Invitation Page

**Purpose:** Onboard members into a chama.

**Access:** Public link with invite code

**Displays:**
- Chama name & description
- Chama type
- Current member count
- Contribution rules (if cycle active)
- Admin name

**Actions:**
- Sign up (if new user)
- Sign in (if existing user)
- Accept invite
- Decline

**After Accept:**
- Add to chama_members
- Redirect to Chama Member View

---

### 7️⃣ Chama Dashboard (Member View)

**Purpose:** Day-to-day interaction for members.

**Displays:**
- Chama info (name, type, status)
- Current cycle info:
  - Your assigned number/turn
  - Next contribution due date
  - Your total contributed (this cycle)
  - Your savings balance
  - Payout status (Received/Upcoming/N/A)
- Member list (names + status)

**Actions:**
- Record contribution
- View contribution history
- View cycle progress
- Leave chama (if no active cycle)

---

### 8️⃣ Chama Admin Dashboard

**Purpose:** Control and manage the chama.

**Admin Controls:**
- Start new cycle
- Pause/end current cycle
- Invite members
- Remove members
- Assign/reshuffle turn order

**Cycle Management:**
- View all contributions (paid/pending/missed)
- Approve contributions
- Mark payouts as sent
- Record defaults

**Analytics:**
- Total collected (this cycle)
- Collection rate (%)
- Savings pot total
- Members by status

---

### 9️⃣ Cycle Page

**Purpose:** Focused view of a single cycle.

**Displays:**
- Cycle name & status
- Period tracker (Week 1 of 12, etc.)
- Member table:
  - Name
  - Turn number
  - Contribution status (per period)
  - Payout status
- Period breakdown (expandable)

**Actions (Admin):**
- Advance to next period
- Close cycle
- Start new cycle

**Actions (Member):**
- View past periods
- See who's next for payout

---

### 🔟 History Page

**Purpose:** Trust + transparency through complete records.

**Displays:**
- Past chamas (completed/left)
- Past cycles
- Contribution history (date, amount, status)
- Payout records
- Savings transactions

**Filters:**
- By chama
- By cycle
- By date range
- By type (contribution/payout/savings)

---

### 1️⃣1️⃣ Wallet / Transactions Page

**Purpose:** Financial clarity for the user.

**Displays:**
- Current savings balance
- Transaction list:
  - Contributions made
  - Payouts received
  - Savings deposits
  - Service fees paid
- Running balance

**Filters:**
- By type
- By date range
- By chama

---

### 1️⃣2️⃣ Notifications Page

**Purpose:** Keep users engaged and informed.

**Notification Types:**
- Contribution reminders (24hr before due)
- Contribution confirmations
- Payout alerts (you're next!)
- Payout confirmations
- Invite accepted
- Cycle started/ended
- Member joined/left
- Admin announcements

**Actions:**
- Mark as read
- Mark all as read
- Click to navigate to relevant page

---

### 1️⃣3️⃣ Profile & Settings

**Purpose:** Account management.

**Sections:**

**Personal Details:**
- Full name
- Phone number
- Email
- Profile photo

**Security:**
- Change password
- Enable OTP login
- Active sessions
- Logout all devices

**Preferences:**
- Notification settings (SMS/Email/Push)
- Language (English/Swahili)

**Danger Zone:**
- Deactivate account
- Delete account (with data export)

---

### 1️⃣4️⃣ Platform Admin (Super Admin)

**Purpose:** Run the business.

**Dashboard:**
- Total users
- Total chamas
- Active cycles
- Revenue (service fees)

**User Management:**
- Search users
- View user details
- Suspend/activate users

**Chama Oversight:**
- View all chamas
- Flag suspicious activity

**Disputes:**
- View open disputes
- Resolve/escalate

**System Settings:**
- Default service fee %
- Min/max contribution
- OTP settings
- Maintenance mode

**Audit Logs:**
- All admin actions
- User actions (filtered)
- Export logs

---

## Database Schema

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS & AUTH                             │
├─────────────────────────────────────────────────────────────────┤
│  users · otp_codes · password_reset_tokens · sessions           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          CHAMAS                                  │
├─────────────────────────────────────────────────────────────────┤
│  chamas · chama_members · invitations · join_requests           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          CYCLES                                  │
├─────────────────────────────────────────────────────────────────┤
│  cycles · cycle_members · contributions · payouts · defaults    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FINANCIAL                                  │
├─────────────────────────────────────────────────────────────────┤
│  savings_accounts · savings_transactions · wallet_transactions  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM & TRUST                              │
├─────────────────────────────────────────────────────────────────┤
│  user_ratings · rating_events · disputes · notifications        │
│  announcements · audit_logs · platform_settings                 │
└─────────────────────────────────────────────────────────────────┘
```

### Complete Schema (SQLite/Turso)

```sql
-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    phone_verified_at TEXT,
    email_verified_at TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'sw')),
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE otp_codes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'login', 'password_reset', 'phone_change')),
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    verified_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_otp_phone ON otp_codes(phone_number, purpose);

CREATE TABLE password_reset_tokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);

-- ============================================
-- 2. CHAMAS (GROUP CONTAINERS)
-- ============================================

CREATE TABLE chamas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    chama_type TEXT NOT NULL CHECK (chama_type IN ('savings', 'merry_go_round', 'hybrid')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    invite_code TEXT UNIQUE NOT NULL,
    is_private INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 50,
    cover_image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_chamas_creator ON chamas(created_by);
CREATE INDEX idx_chamas_invite ON chamas(invite_code);

CREATE TABLE chama_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'removed', 'left')),
    joined_at TEXT DEFAULT (datetime('now')),
    removed_at TEXT,
    removed_by TEXT REFERENCES users(id),
    UNIQUE(chama_id, user_id)
);

CREATE INDEX idx_chama_members_chama ON chama_members(chama_id);
CREATE INDEX idx_chama_members_user ON chama_members(user_id);

CREATE TABLE invitations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    invited_by TEXT NOT NULL REFERENCES users(id),
    invited_phone TEXT,
    invited_email TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TEXT NOT NULL,
    accepted_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_invitations_chama ON invitations(chama_id);
CREATE INDEX idx_invitations_code ON invitations(invite_code);

CREATE TABLE join_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_join_requests_chama ON join_requests(chama_id);

-- ============================================
-- 3. CYCLES (THE MONEY ENGINE)
-- ============================================

CREATE TABLE cycles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contribution_amount INTEGER NOT NULL,  -- Store in cents/smallest unit
    payout_amount INTEGER NOT NULL,
    savings_amount INTEGER NOT NULL,
    service_fee INTEGER NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    total_periods INTEGER NOT NULL,
    current_period INTEGER DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_cycles_chama ON cycles(chama_id);
CREATE INDEX idx_cycles_status ON cycles(status);

CREATE TABLE cycle_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    chama_member_id TEXT NOT NULL REFERENCES chama_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    assigned_number INTEGER,
    turn_order INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'defaulted', 'completed', 'removed')),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(cycle_id, chama_member_id)
);

CREATE INDEX idx_cycle_members_cycle ON cycle_members(cycle_id);
CREATE INDEX idx_cycle_members_user ON cycle_members(user_id);

-- ============================================
-- 4. CONTRIBUTIONS
-- ============================================

CREATE TABLE contributions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    cycle_member_id TEXT NOT NULL REFERENCES cycle_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    period_number INTEGER NOT NULL,
    amount_due INTEGER NOT NULL,
    amount_paid INTEGER DEFAULT 0,
    due_date TEXT NOT NULL,
    paid_at TEXT,
    confirmed_by TEXT REFERENCES users(id),
    confirmed_at TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'late', 'missed', 'partial')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(cycle_id, cycle_member_id, period_number)
);

CREATE INDEX idx_contributions_cycle ON contributions(cycle_id);
CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_contributions_due ON contributions(due_date);

-- ============================================
-- 5. PAYOUTS
-- ============================================

CREATE TABLE payouts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    cycle_member_id TEXT NOT NULL REFERENCES cycle_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    period_number INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'paid', 'confirmed', 'skipped')),
    scheduled_date TEXT,
    paid_at TEXT,
    paid_by TEXT REFERENCES users(id),
    confirmed_by_member INTEGER DEFAULT 0,
    confirmed_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(cycle_id, period_number)
);

CREATE INDEX idx_payouts_cycle ON payouts(cycle_id);
CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================
-- 6. SAVINGS
-- ============================================

CREATE TABLE savings_accounts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE savings_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    savings_account_id TEXT NOT NULL REFERENCES savings_accounts(id),
    cycle_id TEXT REFERENCES cycles(id),
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    reason TEXT NOT NULL CHECK (reason IN ('contribution', 'withdrawal', 'bonus', 'penalty', 'adjustment')),
    balance_after INTEGER NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_savings_tx_user ON savings_transactions(user_id);
CREATE INDEX idx_savings_tx_account ON savings_transactions(savings_account_id);

-- ============================================
-- 7. WALLET & MONEY TRACEABILITY
-- ============================================

CREATE TABLE wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chama_id TEXT REFERENCES chamas(id),
    cycle_id TEXT REFERENCES cycles(id),
    type TEXT NOT NULL CHECK (type IN ('contribution', 'payout', 'savings_credit', 'savings_debit', 'fee', 'refund')),
    amount INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    reference_type TEXT,  -- 'contribution', 'payout', 'savings_transaction'
    reference_id TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_cycle ON wallet_transactions(cycle_id);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);

-- ============================================
-- 8. RATINGS & TRUST SYSTEM
-- ============================================

CREATE TABLE user_ratings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_score INTEGER DEFAULT 100,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_cycles_completed INTEGER DEFAULT 0,
    total_on_time_payments INTEGER DEFAULT 0,
    total_late_payments INTEGER DEFAULT 0,
    total_missed_payments INTEGER DEFAULT 0,
    last_calculated_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE rating_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cycle_id TEXT REFERENCES cycles(id),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'on_time_payment', 'late_payment', 'missed_payment',
        'cycle_completed', 'payout_confirmed', 'default_recorded',
        'dispute_won', 'dispute_lost', 'admin_adjustment'
    )),
    points_change INTEGER NOT NULL,
    reason TEXT,
    event_date TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_rating_events_user ON rating_events(user_id);

-- ============================================
-- 9. DEFAULTS & PENALTIES
-- ============================================

CREATE TABLE defaults (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    cycle_member_id TEXT NOT NULL REFERENCES cycle_members(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    period_number INTEGER NOT NULL,
    contribution_id TEXT REFERENCES contributions(id),
    reason TEXT NOT NULL,
    penalty_amount INTEGER DEFAULT 0,
    penalty_points INTEGER DEFAULT 0,
    resolved INTEGER DEFAULT 0,
    resolved_at TEXT,
    resolved_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_defaults_cycle ON defaults(cycle_id);
CREATE INDEX idx_defaults_user ON defaults(user_id);

-- ============================================
-- 10. DISPUTES & SUPPORT
-- ============================================

CREATE TABLE disputes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT REFERENCES chamas(id),
    cycle_id TEXT REFERENCES cycles(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('contribution', 'payout', 'admin_action', 'member_conduct', 'other')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'escalated', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to TEXT REFERENCES users(id),
    resolution TEXT,
    resolved_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_disputes_user ON disputes(user_id);
CREATE INDEX idx_disputes_status ON disputes(status);

CREATE TABLE dispute_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    dispute_id TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,  -- Internal notes (admin only)
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- 11. NOTIFICATIONS & ANNOUNCEMENTS
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
    data TEXT,  -- JSON for additional context
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

-- ============================================
-- 12. AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    actor_id TEXT REFERENCES users(id),
    actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'admin')),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values TEXT,  -- JSON
    new_values TEXT,  -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- 13. PLATFORM SETTINGS
-- ============================================

CREATE TABLE platform_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,  -- JSON
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

-- ============================================
-- 14. TRIGGERS FOR updated_at
-- ============================================

-- Note: Turso/SQLite doesn't support triggers in the same way
-- Handle updated_at in application code
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/signup              Create new account
POST   /api/auth/signin              Login with credentials
POST   /api/auth/signout             Logout (invalidate session)
POST   /api/auth/otp/send            Send OTP to phone
POST   /api/auth/otp/verify          Verify OTP code
POST   /api/auth/password/forgot     Request password reset
POST   /api/auth/password/reset      Reset password with token
GET    /api/auth/session             Get current session
```

### User

```
GET    /api/user/me                  Get current user profile
PATCH  /api/user/me                  Update profile
GET    /api/user/dashboard           Get dashboard data
DELETE /api/user/me                  Delete account
```

### Chamas

```
POST   /api/chamas                   Create new chama
GET    /api/chamas                   List user's chamas
GET    /api/chamas/:id               Get chama details
PATCH  /api/chamas/:id               Update chama
DELETE /api/chamas/:id               Delete chama (admin only)

GET    /api/chamas/:id/members       List chama members
POST   /api/chamas/:id/members       Add member (admin)
DELETE /api/chamas/:id/members/:mid  Remove member (admin)
PATCH  /api/chamas/:id/members/:mid  Update member role

POST   /api/chamas/:id/invite        Generate invite
GET    /api/chamas/join/:code        Get invite details
POST   /api/chamas/join/:code        Accept invite
```

### Cycles

```
POST   /api/chamas/:id/cycles        Create new cycle
GET    /api/chamas/:id/cycles        List chama cycles
GET    /api/cycles/:id               Get cycle details
PATCH  /api/cycles/:id               Update cycle (start/pause/end)
DELETE /api/cycles/:id               Cancel cycle

GET    /api/cycles/:id/members       List cycle members
POST   /api/cycles/:id/members       Add cycle member
PATCH  /api/cycles/:id/members/:mid  Update turn order
POST   /api/cycles/:id/shuffle       Randomize turn order
POST   /api/cycles/:id/advance       Advance to next period
```

### Contributions

```
GET    /api/cycles/:id/contributions           List all contributions
GET    /api/cycles/:id/contributions/me        My contributions
POST   /api/cycles/:id/contributions           Record contribution
PATCH  /api/contributions/:id                  Update contribution
POST   /api/contributions/:id/confirm          Confirm contribution (admin)
```

### Payouts

```
GET    /api/cycles/:id/payouts       List all payouts
GET    /api/payouts/:id              Get payout details
POST   /api/payouts/:id/send         Mark as sent (admin)
POST   /api/payouts/:id/confirm      Confirm receipt (member)
```

### Savings

```
GET    /api/savings                  Get savings account
GET    /api/savings/transactions     List savings transactions
POST   /api/savings/withdraw         Request withdrawal
```

### Wallet

```
GET    /api/wallet/transactions      List all wallet transactions
GET    /api/wallet/balance           Get balances summary
```

### Notifications

```
GET    /api/notifications            List notifications
PATCH  /api/notifications/:id/read   Mark as read
POST   /api/notifications/read-all   Mark all as read
GET    /api/notifications/unread     Get unread count
```

### Disputes

```
POST   /api/disputes                 Create dispute
GET    /api/disputes                 List user's disputes
GET    /api/disputes/:id             Get dispute details
POST   /api/disputes/:id/messages    Add message
```

### Platform Admin

```
GET    /api/admin/dashboard          Admin dashboard stats
GET    /api/admin/users              List all users
GET    /api/admin/users/:id          Get user details
PATCH  /api/admin/users/:id          Update user (suspend/activate)
GET    /api/admin/chamas             List all chamas
GET    /api/admin/disputes           List all disputes
PATCH  /api/admin/disputes/:id       Update dispute
GET    /api/admin/settings           Get platform settings
PATCH  /api/admin/settings           Update settings
GET    /api/admin/audit-logs         View audit logs
```

---

## Background Jobs

These should run on a schedule (cron) or be triggered by events:

| Job | Schedule | Description |
|-----|----------|-------------|
| `sendContributionReminders` | Daily 9 AM | Notify members 24hr before due date |
| `markOverdueContributions` | Daily 1 AM | Mark missed contributions, record defaults |
| `advanceCyclePeriods` | Daily 12 AM | Auto-advance periods based on dates |
| `calculateUserRatings` | Daily 2 AM | Recalculate trust scores |
| `expireInvitations` | Daily 3 AM | Mark expired invites |
| `cleanupOtpCodes` | Hourly | Delete expired OTP codes |
| `cleanupSessions` | Daily 4 AM | Delete expired sessions |
| `sendPayoutReminders` | Daily 10 AM | Notify admins of pending payouts |

---

## Project Structure

```
merry/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth group
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/              # Protected routes
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── chamas/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx       # Chama dashboard
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── cycles/
│   │   │   │   │   │   ├── [cycleId]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── new/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── members/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Create chama wizard
│   │   │   │   └── page.tsx           # List chamas
│   │   │   ├── wallet/
│   │   │   │   └── page.tsx
│   │   │   ├── history/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (public)/                  # Public routes
│   │   │   ├── join/
│   │   │   │   └── [code]/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── admin/                     # Platform admin
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── chamas/
│   │   │   │   └── page.tsx
│   │   │   ├── disputes/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/                       # API routes
│   │   │   ├── auth/
│   │   │   │   ├── signup/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── signin/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── signout/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── otp/
│   │   │   │   │   ├── send/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── verify/
│   │   │   │   │       └── route.ts
│   │   │   │   └── session/
│   │   │   │       └── route.ts
│   │   │   ├── user/
│   │   │   │   ├── me/
│   │   │   │   │   └── route.ts
│   │   │   │   └── dashboard/
│   │   │   │       └── route.ts
│   │   │   ├── chamas/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── members/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── cycles/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── invite/
│   │   │   │   │       └── route.ts
│   │   │   │   └── join/
│   │   │   │       └── [code]/
│   │   │   │           └── route.ts
│   │   │   ├── cycles/
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── members/
│   │   │   │       │   └── route.ts
│   │   │   │       ├── contributions/
│   │   │   │       │   └── route.ts
│   │   │   │       └── payouts/
│   │   │   │           └── route.ts
│   │   │   ├── contributions/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── payouts/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── savings/
│   │   │   │   └── route.ts
│   │   │   ├── wallet/
│   │   │   │   └── route.ts
│   │   │   ├── notifications/
│   │   │   │   └── route.ts
│   │   │   ├── disputes/
│   │   │   │   └── route.ts
│   │   │   └── admin/
│   │   │       └── [...]
│   │   │
│   │   ├── page.tsx                   # Homepage
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                        # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── forms/                     # Form components
│   │   │   ├── signin-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   ├── create-chama-form.tsx
│   │   │   ├── create-cycle-form.tsx
│   │   │   └── contribution-form.tsx
│   │   │
│   │   ├── layout/                    # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── page-header.tsx
│   │   │
│   │   ├── dashboard/                 # Dashboard components
│   │   │   ├── summary-cards.tsx
│   │   │   ├── chama-list.tsx
│   │   │   ├── recent-activity.tsx
│   │   │   └── upcoming-events.tsx
│   │   │
│   │   ├── chama/                     # Chama-specific components
│   │   │   ├── member-list.tsx
│   │   │   ├── member-card.tsx
│   │   │   ├── cycle-card.tsx
│   │   │   ├── contribution-table.tsx
│   │   │   ├── payout-schedule.tsx
│   │   │   └── invite-modal.tsx
│   │   │
│   │   ├── cycle/                     # Cycle components
│   │   │   ├── period-tracker.tsx
│   │   │   ├── turn-order.tsx
│   │   │   ├── contribution-status.tsx
│   │   │   └── payout-card.tsx
│   │   │
│   │   └── shared/                    # Shared components
│   │       ├── empty-state.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── confirm-dialog.tsx
│   │       └── status-badge.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts              # Turso client setup
│   │   │   ├── queries/
│   │   │   │   ├── users.ts
│   │   │   │   ├── chamas.ts
│   │   │   │   ├── cycles.ts
│   │   │   │   ├── contributions.ts
│   │   │   │   ├── payouts.ts
│   │   │   │   ├── savings.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── audit.ts
│   │   │   └── migrations/
│   │   │       ├── 001_initial.sql
│   │   │       └── ...
│   │   │
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   ├── password.ts
│   │   │   ├── otp.ts
│   │   │   └── middleware.ts
│   │   │
│   │   ├── services/
│   │   │   ├── chama-service.ts
│   │   │   ├── cycle-service.ts
│   │   │   ├── contribution-service.ts
│   │   │   ├── payout-service.ts
│   │   │   ├── savings-service.ts
│   │   │   ├── rating-service.ts
│   │   │   └── notification-service.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── format.ts              # Currency, date formatting
│   │   │   ├── validation.ts          # Input validation
│   │   │   ├── phone.ts               # Kenyan phone number utils
│   │   │   ├── invite-code.ts         # Code generation
│   │   │   └── constants.ts           # App constants
│   │   │
│   │   └── hooks/
│   │       ├── use-user.ts
│   │       ├── use-chamas.ts
│   │       ├── use-cycle.ts
│   │       ├── use-notifications.ts
│   │       └── use-toast.ts
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── chama.ts
│   │   ├── cycle.ts
│   │   ├── contribution.ts
│   │   ├── payout.ts
│   │   ├── notification.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
│   ├── images/
│   └── icons/
│
├── scripts/
│   ├── migrate.ts                     # Run migrations
│   ├── seed.ts                        # Seed test data
│   └── jobs/
│       ├── reminders.ts
│       ├── overdue-checker.ts
│       └── rating-calculator.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Development Phases

### Phase 0: Setup (3-4 days)
- [x] Project scope document
- [ ] Initialize Next.js project
- [ ] Configure Turso connection
- [ ] Run database migrations
- [ ] Set up Tailwind + UI components
- [ ] Configure ESLint + Prettier
- [ ] Set up environment variables

### Phase 1: Foundation (Week 1-2)
- [ ] Authentication system
  - [ ] Sign up with OTP verification
  - [ ] Sign in (password + OTP)
  - [ ] Session management
  - [ ] Password reset flow
- [ ] User profile
  - [ ] View/edit profile
  - [ ] Change password
- [ ] Base layouts
  - [ ] Public layout
  - [ ] Dashboard layout (sidebar, header)
  - [ ] Mobile navigation

### Phase 2: Homepage & Core UI (Week 2-3)
- [ ] Homepage
  - [ ] Hero section
  - [ ] Features explanation
  - [ ] How it works
  - [ ] CTAs
- [ ] User Dashboard
  - [ ] Summary cards
  - [ ] Chama list
  - [ ] Empty states
  - [ ] Quick actions

### Phase 3: Chama Management (Week 3-4)
- [ ] Create Chama wizard
  - [ ] Step 1: Basic info
  - [ ] Step 2: Type selection
  - [ ] Step 3: Optional rules
  - [ ] Step 4: Review & create
- [ ] Chama dashboard (member view)
- [ ] Chama admin dashboard
- [ ] Member management
  - [ ] View members
  - [ ] Invite members
  - [ ] Remove members
- [ ] Join chama flow
  - [ ] Invite page
  - [ ] Accept invite

### Phase 4: Cycle Engine (Week 4-5)
- [ ] Create cycle
  - [ ] Set contribution rules
  - [ ] Define periods
  - [ ] Assign members
- [ ] Turn assignment
  - [ ] Manual assignment
  - [ ] Random shuffle
- [ ] Cycle dashboard
  - [ ] Period tracker
  - [ ] Member status
  - [ ] Contribution overview
- [ ] Cycle controls
  - [ ] Start/pause/end
  - [ ] Advance period

### Phase 5: Contributions & Payouts (Week 5-6)
- [ ] Contribution recording
  - [ ] Member submits
  - [ ] Admin confirms
- [ ] Contribution tracking
  - [ ] Status updates
  - [ ] Late/missed marking
- [ ] Payout scheduling
  - [ ] Auto-schedule based on turn
  - [ ] Admin triggers
- [ ] Payout confirmation
  - [ ] Admin marks as sent
  - [ ] Member confirms receipt
- [ ] Default handling
  - [ ] Record defaults
  - [ ] Apply penalties

### Phase 6: Financial Features (Week 6-7)
- [ ] Savings accounts
  - [ ] Auto-create on signup
  - [ ] Credit from contributions
  - [ ] View balance
- [ ] Wallet transactions
  - [ ] Transaction history
  - [ ] Filters
  - [ ] Export (CSV)
- [ ] History page
  - [ ] Past chamas
  - [ ] Past cycles
  - [ ] All transactions

### Phase 7: Notifications & Polish (Week 7-8)
- [ ] Notification system
  - [ ] In-app notifications
  - [ ] Notification page
  - [ ] Mark as read
- [ ] Rating system
  - [ ] Event recording
  - [ ] Score calculation
  - [ ] Display tier
- [ ] Profile & Settings
  - [ ] Notification preferences
  - [ ] Security settings

### Phase 8: Admin & Testing (Week 8-9)
- [ ] Platform admin
  - [ ] Dashboard
  - [ ] User management
  - [ ] Chama oversight
  - [ ] Settings
- [ ] Audit logs
  - [ ] Log all actions
  - [ ] View logs (admin)
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
- [ ] Bug fixes & polish

### Phase 9: Launch Prep (Week 9-10)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment setup
- [ ] Monitoring & logging
- [ ] Soft launch

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Turso CLI

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/merry.git
cd merry

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up Turso database
turso db create merry
turso db tokens create merry

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm test         # Run tests
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed test data
pnpm db:reset     # Reset database
```

---

## Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Merry

# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Auth
SESSION_SECRET=your-session-secret-min-32-chars
OTP_EXPIRY_MINUTES=10

# SMS (Africa's Talking)
AT_API_KEY=your-api-key
AT_USERNAME=your-username
AT_SENDER_ID=MERRY

# Optional: Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
EMAIL_FROM=noreply@merry.app
```

---

## Security Considerations

### Authentication
- Passwords hashed with bcrypt (12 rounds)
- OTP expires after 10 minutes
- Max 3 OTP attempts before lockout
- Sessions expire after 30 days
- Secure, HTTP-only cookies

### Authorization
- Role-based access control (member/admin/super_admin)
- Verify chama membership on all chama routes
- Verify cycle membership on all cycle routes
- Admin actions require admin role check

### Data Protection
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (React default escaping)
- CSRF protection (SameSite cookies)
- Rate limiting on auth endpoints

### Audit Trail
- All admin actions logged
- All financial actions logged
- Logs include actor, action, timestamp, IP

---

## Future Roadmap

### v1.1 - Payments
- [ ] M-Pesa STK Push integration
- [ ] Automatic payment tracking
- [ ] Payment receipts
- [ ] Withdrawal processing

### v1.2 - Enhanced Features
- [ ] SMS notifications
- [ ] Email notifications
- [ ] Push notifications (PWA)
- [ ] Calendar integration

### v1.3 - Analytics
- [ ] Chama analytics dashboard
- [ ] Contribution trends
- [ ] Member performance reports
- [ ] Export reports (PDF)

### v1.4 - Social
- [ ] Member profiles
- [ ] Public chama discovery
- [ ] Reviews/ratings for chamas
- [ ] Referral program

### v2.0 - Mobile Apps
- [ ] React Native app
- [ ] Offline support
- [ ] Biometric auth
- [ ] Push notifications

---

## License

Proprietary - All rights reserved.

---

## Support

For questions or issues, contact: support@merry.app

