# Admin Portal Revello Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Beautiful Gate Admin Portal into the modern SaaS layout of the Revello reference dashboard across `/admin`, `/admin/dispatch`, `/admin/artisans`, `/admin/donations`, and `/admin/directory`, retaining 100% database-backed functionality and the Beautiful Gate warm orange `#F37021` color palette.

**Architecture:** A persistent `AdminShell` layout component containing a collapsible left navigation sidebar, top global search, date range filter, and language toggle wraps all `/admin/*` subroutes. Each sub-page renders inside clean daylight white cards (`rounded-2xl border border-neutral-200/90 shadow-xs`) with `tabular-nums` typography.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Lucide React icons, Supabase client (`AuthContext`).

**Spec:** `/Users/normanlee/.gemini/antigravity/brain/f6d44514-9dc3-4196-8c3b-b7a0bf807f7e/admin-redesign-spec.md`

## Global Constraints
- Preserve brand color `#F37021` as the primary active accent; use `#18181B` for dark elements.
- Never use AI slop (no `animate-pulse`, `animate-bounce`, multi-stop dark gradients, or `rounded-3xl` on flat tables).
- Maintain all database operations (live dispatch status stepper, booking approve/decline, workshop partner catalog, piece-rate earnings ledger, payroll CSV export, donation verification, driver leave approvals, fleet vehicle profile editing, user role administration).
- Preserve tri-language localization (`en`, `zh`, `ms`) via `useLanguage`.

## Review Focus
- Active dispatch status update updates Supabase database state and reflects immediately.
- Approving or declining a booking in `/admin/dispatch` updates the status and recalculates badge counts.
- Adding or editing a card collaborator in `/admin/artisans` saves correctly and updates the piece-rate catalog.
- Verifying a driver cash collection in `/admin/donations` marks donation as paid.
- Approving or rejecting a driver leave request in `/admin/directory` updates leave status and transit timetable blocks.

---

### Task 1: Create Shared Admin Shell (`AdminShell.tsx`) & Admin Layout (`layout.tsx`)

**Files:**
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/app/admin/layout.tsx`

**Step-by-step instructions:**
- [ ] Create `src/components/admin/AdminShell.tsx`:
  - Build collapsible left navigation sidebar:
    - Top header: Beautiful Gate logo image (`/images/beautiful-gate-logo.png`), "Beautiful Gate" brand title, collapse toggle button.
    - Navigation items with active state highlighting (orange `#F37021`), hover states, and live badge counters:
      - **GENERAL**:
        - Dashboard (`/admin`)
        - Transit Dispatch (`/admin/dispatch`, badge for pending bookings)
        - Workshop & Artisans (`/admin/artisans`)
      - **FINANCE**:
        - Donations (`/admin/donations`, badge for pending cash handover)
      - **MANAGEMENT**:
        - User Directory & Fleet (`/admin/directory`, badge for pending driver leaves)
    - Bottom profile card: current admin user avatar (`UserAvatar`), full name, role badge ("Supervisor / Admin"), profile modal trigger, and sign out button.
  - Build top bar:
    - Global quick search input with `⌘K` keyboard shortcut pill.
    - Date range dropdown picker (Today, This Week, This Month, This Year).
    - Language selector pill (`EN` | `中文` | `BM`).
    - Notification bell showing pending booking / leave counters.
- [ ] Create `src/app/admin/layout.tsx`:
  - Wrap `{children}` in `AdminShell`.
  - Include auth guard: redirect non-admin or unauthenticated users to `/login`.
- [ ] Run `npm run build` to verify layout compiles without error.
- [ ] Commit changes: `git commit -m "feat(admin): add revello admin shell and layout"`

---

### Task 2: Build Overview Dashboard Page (`/admin`)

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step-by-step instructions:**
- [ ] Replace `src/app/admin/page.tsx` with the new Revello Overview Dashboard:
  - **4 Top KPI Cards**:
    - Total Donations (MTD) with trend and Cash vs QR pill.
    - Active & Scheduled Dispatches with today's run count and passenger capacity.
    - Artisan Workshop Production with cards completed MTD and RM payout.
    - Registered Community Members with Daycare, Resident, Non-Resident breakdown.
  - **Dual Central Charts**:
    - Left Chart: *Donation Inflow Over Time* (Driver Cash Handover vs DuitNow QR collections over past months with interactive SVG area curve and tooltip).
    - Right Chart: *Artisan Workshop Production & Payouts* (Monthly craft cards produced vs RM payouts disbursed).
  - **Bottom Row**:
    - Left (Span 2): *Top OKU Artisan Leaderboard* (Ranked table of artisans, units made, MTD earnings, with link to full ledger).
    - Right (Span 1): *Collaborator & Card Series Output Donut Chart* (Interactive SVG Donut chart displaying production volume across resort partners with center total).
- [ ] Verify dynamic calculations using Supabase `bookings`, `workLogs`, `products`, and `profiles`.
- [ ] Run `npm run build` to ensure 0 errors.
- [ ] Commit changes: `git commit -m "feat(admin): build revello overview dashboard page"`

---

### Task 3: Build Transit Dispatch Page (`/admin/dispatch`)

**Files:**
- Create: `src/app/admin/dispatch/page.tsx`

**Step-by-step instructions:**
- [ ] Port the transit dispatch management interface to `src/app/admin/dispatch/page.tsx`:
  - Active Dispatch live tracker with route stepper (`Home → Pickup → Hospital → Arrived`).
  - Chronological slot-grouped transit runs table with driver plate, passenger rosters, and capacity badges.
  - Seat Layout floor plan modal trigger (`VanFloorPlanModal`).
  - Instant booking approve and decline actions with feedback toast.
  - Filter tabs: All, Active, Pending, Completed.
- [ ] Run `npm run build` to ensure type safety.
- [ ] Commit changes: `git commit -m "feat(admin): create dedicated dispatch page"`

---

### Task 4: Build Artisan Workshop Page (`/admin/artisans`)

**Files:**
- Create: `src/app/admin/artisans/page.tsx`

**Step-by-step instructions:**
- [ ] Port the workshop management interface to `src/app/admin/artisans/page.tsx`:
  - Workshop Collaborators & Piece-Rate Catalog grid with partner cards (resort client, card name, piece rate per piece).
  - Add / Edit Collaborator & Piece-Rate modal.
  - Registered OKU Artisans Table with search, cards MTD, MTD earnings, YTD earnings.
  - Log Cards on Behalf modal with instant optimistic work log update.
  - Export Payroll CSV functionality.
- [ ] Run `npm run build` to verify clean build.
- [ ] Commit changes: `git commit -m "feat(admin): create dedicated artisans workshop page"`

---

### Task 5: Build Donations Tracker Page (`/admin/donations`)

**Files:**
- Create: `src/app/admin/donations/page.tsx`

**Step-by-step instructions:**
- [ ] Port donation tracking to `src/app/admin/donations/page.tsx`:
  - 3 Summary Cards: Donation in a Month, Donation via QR, Donation via Driver Cash.
  - Time Range Filter (1 Week, 1 Month, 1 Year) and Channel filter (All, Cash, QR).
  - Donation Audit Ledger table with date, passenger name, amount, channel, and receipt verification status.
  - Driver cash handover verification action (`verifyDonation`).
- [ ] Run `npm run build` to verify clean build.
- [ ] Commit changes: `git commit -m "feat(admin): create dedicated donations page"`

---

### Task 6: Build Directory & Fleet Management Page (`/admin/directory`)

**Files:**
- Create: `src/app/admin/directory/page.tsx`

**Step-by-step instructions:**
- [ ] Port directory & fleet asset management to `src/app/admin/directory/page.tsx`:
  - Fleet Asset Card: Toyota HiAce Commuter specs, factory exterior finish, accessible seating layout, and `VehicleModal` edit trigger.
  - Driver Leave Requests & Approvals section with approve/reject buttons and timetable auto-sync.
  - User Directory table with search and role filter tabs (All, Beneficiaries, Drivers, Admins).
  - Add / Edit User Profile modal (`ProfileModal`).
  - Delete User Profile confirmation modal.
- [ ] Run `npm run build` to verify clean build.
- [ ] Commit changes: `git commit -m "feat(admin): create dedicated directory and fleet page"`

---

### Task 7: Final Build Verification, Regression Testing & Push

**Step-by-step instructions:**
- [ ] Run `npm run build` to verify complete production build with Turbopack.
- [ ] Test full navigation across all routes (`/admin`, `/admin/dispatch`, `/admin/artisans`, `/admin/donations`, `/admin/directory`).
- [ ] Verify tri-language translation switches correctly across all routes.
- [ ] Verify mobile responsiveness (sidebar collapse & drawer toggle).
- [ ] Push to `origin main`.
