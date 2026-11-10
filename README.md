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

### 4. Supabase Database Schema
PostgreSQL schema with Row Level Security (RLS) policies is located at:
[`supabase/migrations/20261110_init_beautiful_gate.sql`](file:///Users/normanlee/Documents/GitHub/BeautifulGate/supabase/migrations/20261110_init_beautiful_gate.sql)

---

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
