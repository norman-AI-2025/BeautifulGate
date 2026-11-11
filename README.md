# Beautiful Gate · Assisted Mobility & Artisan Workshop Platform

A production-grade web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, and synchronized state management, designed with clean whitespace, mobile ergonomics, and an Apple Human Interface Guidelines aesthetic.

---

## Key Features & User Experience

### 1. Mobile-First Beneficiary Portal (`/portal`)
- **"Book a Service" Tab**:
  - **Select Date Button**: Choose an exact date using an interactive calendar picker or quick weekday chips (Mon–Sun).
  - **Date-Specific Expanded Timetable**: Once a date is selected, the schedule expands for that particular date only.
  - **Blank Available Slots**: Available slots are clean, white, interactive tap targets without notes or text clutter.
  - **Booked / Closed / Pending Status**:
    - **Booked**: Solid cyan block (`#00c0f0`).
    - **Holiday / Closed**: Crimson red card (`#8B1E24`, e.g., *HARI DEEPAVALI*).
    - **Pending**: Yellow block.

- **Compact Van-Shaped Floor Plan Modal**:
  - **Aerodynamic Van Silhouette**: Realistic top-down commuter van shape with hood, curved windshield, side mirrors, and rear ramp.
  - **Minimal Seat Icons Only**: Clean `Armchair` icons for passenger seats and `Accessibility` icons for wheelchair bays (no walls of text).
  - **Auto-Filled Account Details**: Passenger Name, Malaysian OKU ID, and Contact Number are automatically pre-filled from the user's account profile.
  - **Search Bars with Auto-Locate & Suggestions**:
    - **Pickup Address Search Bar**: Instant location suggestions (Klang Valley / Selangor residences) + 1-click **Auto-Locate GPS** button.
    - **Destination Search Bar**: Instant hospital suggestions (*Hospital Tuanku Ja'afar*, *HKL*, *PPUM*, *Serdang*, *Selayang*, etc.).
    - Department/clinic field and verbose dispatch descriptions removed.

- **"Booking Status" Tab**:
  - Real-time progression status bar for approved rides:
    $$\text{On the way to pick up} \longrightarrow \text{Picked up} \longrightarrow \text{On the way to destination} \longrightarrow \text{Arrived}$$
  - **Post-Service Beneficiary Rating**:
    - Completed rides allow passengers to submit an interactive **1 to 5 star rating**, select appreciation tags, and leave feedback.
    - Ratings immediately sync and display on the **Administrator Dispatch Board**.

- **"My Earnings" Tab**:
  - 4 clean stat cards (**Today**, **This Week**, **This Month**, **This Year**) and daily card entry with live RM payout calculator.

---

### 2. Driver Console (`/driver`)
- **Today's Queue List First**: Chronological manifest of pickups shown right at the top.
- **15-Minute Green Interactive Container**:
  - Pickups within 15 minutes pulse with an emerald green border (`border-2 border-emerald-500 ring-4 ring-emerald-100`).
  - Clicking expands the card into the **Current Active Mission**.
- **Sequential Single-Button State Machine**:
  $$\text{Start Route to Pickup} \longrightarrow \text{Done Pick Up} \longrightarrow \text{Depart to Hospital} \longrightarrow \text{Done Drop Off} \longrightarrow \text{On the Way to Next Customer}$$
  - Direct 1-tap **Call Passenger** and **WhatsApp** buttons.

---

### 3. Administrator Control Tower (`/admin`)
- **Prioritized Current Active Dispatch (Hero Card)**: The top of the dispatch board prioritizes the active on-the-road van with live checkpoint progression.
- **Live Dispatch Board with Ratings**:
  - Filter tabs: `All`, `Pending Approval` (yellow), `In Transit` (teal), and `Completed` (emerald).
  - 1-click **Approve** and **Decline** actions.
  - **Beneficiary Ratings Column**: Displays 5-star ratings and passenger reviews in real time.
- **Artisan Ledger & CSV Export**:
  - Searchable OKU artisan directory with bank disbursement drawer and manual work overrides.
  - **"Export Payroll CSV"** button for direct bank disbursement.

---

### 4. Zero Mock Data & Production-Ready State
- **Clean Architecture**: All mock datasets (beneficiary profiles, craft products, seeded transit bookings, dummy drivers) have been removed.
- **Dynamic User Flow**:
  - New users register via `/signup` with role options (`Beneficiary / Caregiver`, `Driver`, or `Administrator`).
  - Drivers and beneficiaries manage their own profiles, photos, and emergency contacts via the interactive Profile Modal.
  - Supervisors maintain administrative oversight over the driver roster and vehicle assignments.

---

### 5. Supabase Database Integration & Deployment Guide

#### A. Set Up Database Schema in Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open your project's **SQL Editor**.
3. Copy the entire contents of [`supabase/schema.sql`](file:///Users/normanlee/Documents/GitHub/BeautifulGate/supabase/schema.sql) and paste it into the editor.
4. Click **Run**. This creates:
   - `profiles` table (with avatars, driver certifications, vehicle plate assignments, and emergency contacts).
   - `transit_bookings` table (with wheelchair allocations, donation audit fields, ratings, and coordinates).
   - `card_products` and `card_work_logs` tables.
   - Row Level Security (RLS) policies.
   - Supabase Realtime publication for instant cross-device updates.

#### B. Configure Environment Variables
Copy `.env.example` to `.env.local` or configure in your deployment dashboard (e.g., Vercel, Netlify):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

*(Note: The platform features a resilient local reactive storage fallback. If Supabase credentials are not supplied, the platform operates in full local mode without crashing.)*

#### C. Deploy to Vercel

```bash
# Deploy with Vercel CLI
vercel --prod
```
Or import the Git repository into Vercel/Netlify, adding `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the project's Environment Variables settings.

---

## Running the Application Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
