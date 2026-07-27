# 03_APPLICATION_FLOW_AND_UI_UX.md

## System Context
You are building the user workflows and front-end interface routes for **BloodBridge AI**. The UI must feel like a premium, life-saving healthcare SaaS — not a boring admin panel. Every pixel should convey urgency, trust, and intelligence.

---

## 1. Application Flow Pipeline

```
[ Blood Inventory Data (Hospitals & Blood Banks) ]
                      │
                      ▼
            [ Secure API Integration ]
                      │
                      ▼
    [ BloodBridge AI Intelligence Platform ]
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    [ Shortage   [ Demand    [ Expiry
    Prediction ]  Forecast ]  Prediction ]
         └────────────┬────────────┘
                      ▼
         [ AI Recommendation Engine ]
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  [ Redistribution ] [ Route ] [ Smart Alerts ]
         └────────────┬────────────┘
                      ▼
        [ Hospital Decision Dashboard ]
                      │
                      ▼
 ┌─────────────────────────────────────────┐
 │ Outcomes:                               │
 │  ✓ Reduced Blood Wastage                │
 │  ✓ Faster Emergency Response            │
 │  ✓ Better Regional Availability         │
 │  ✓ AI-Powered Decision Support          │
 └─────────────────────────────────────────┘
```

---

## 2. UI / UX Design & Navigation Map

### Global Layout Architecture
- **Sidebar:** Collapsible glassmorphism sidebar (left, 72px collapsed / 260px expanded) with icon + label navigation.
- **Top Bar:** Sticky header with hospital name, live pulse indicator (green dot with ripple animation), notification bell with badge, user avatar dropdown.
- **Page Transitions:** Framer Motion `AnimatePresence` with fade + slight Y-translate (0.2s, ease-out).
- **Background:** Subtle animated gradient mesh (soft crimson → slate → soft teal) on a `slate-50` base. NOT a static flat color.
- **Cards:** Glassmorphism cards — `bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-slate-200/50` with subtle hover lift (`translateY(-2px)` + shadow increase).

---

### Screen 1: Main Hospital Decision Dashboard (`/dashboard`)
**The Hero Screen.** This is what judges see first. It must WOW.

#### A. Hero KPI Cards (Top Row — 4 cards)
Each card is a glassmorphism panel with:
- **Icon:** Inside a soft gradient circle (e.g., crimson gradient for "Critical Alerts", emerald for "Total Stock")
- **Number:** Large bold stat with a **count-up animation** on mount (0 → value over 1s)
- **Trend:** Mini sparkline (7-day trend) using Recharts, color-coded
- **Label:** Small caps label
- **Hover:** Subtle glow effect matching the card's accent color

Cards:
1. **Total Stock Units** — Emerald theme, shows total across all blood groups
2. **Impending Shortages** — Crimson theme, pulsing red border if > 0
3. **Units Near Expiry** — Amber theme, countdown timer feel
4. **Active Emergency Requests** — Rose theme, heartbeat pulse animation on the icon

#### B. Live Regional Availability Grid (Middle Section)
- A **bento-grid** layout showing 4-6 nearby hospitals as cards.
- Each card shows: Hospital name, distance, a mini "blood group availability bar" (horizontal stacked bar: A+, B+, O+, etc.)
- **Status Ring:** A circular progress ring around the hospital avatar showing overall availability %.
- **Click:** Expands to show full inventory matrix for that hospital.
- **Animation:** Staggered entrance (0.05s delay per card).

#### C. Inventory Overview Matrix (Bottom Section)
- **The Blood Grid:** An 8x5 grid (8 blood groups × 5 components).
- Each cell is a small square with:
  - Blood group label (e.g., "A+")
  - Component icon (drop, platelet, plasma)
  - Unit count
  - **Color-coded status dot:** Emerald (sufficient), Amber (low < 20 units), Crimson (critical < 5 units)
- **Hover:** Tooltip shows exact count, expiry breakdown, and AI-predicted demand for next 7 days.
- **Click:** Opens a detail drawer (slide-in from right) with full history and AI insights for that blood group.

#### D. Emergency Action Bar (Floating FAB)
- A **floating action button** (bottom-right, crimson gradient, pulsing shadow) labeled "🚨 Emergency Request"
- Click opens a modal with rapid blood type selection and auto-broadcast to nearest hospitals.

---

### Screen 2: AI Predictive Insights View (`/predictions`)
**The Intelligence Screen.** Show the AI's brain.

#### A. 7-Day Demand Forecast Chart (Hero Element)
- **Large interactive area chart** with:
  - Gradient fill under the line (crimson → transparent)
  - Confidence interval shaded band (light crimson, 20% opacity)
  - Hover tooltip showing exact predicted value + confidence %
  - Toggle buttons for different blood groups (pill-shaped, active state has crimson bg)
- **Animation:** Line draws itself on mount (SVG path animation or Recharts animation).

#### B. Shortage Risk Score Cards (Grid of 4)
Each card represents a blood group at risk:
- **Risk Meter:** A semi-circular gauge (0-100%) with color zones (green → yellow → red)
- **Risk Score:** Large percentage number
- **AI Explanation:** A natural-language sentence: *"O+ shortage predicted in 3 days due to weekend trauma admissions + low donor turnout."*
- **Feature Importance:** Horizontal bar chart showing top 3 factors (e.g., "Weekend +42%", "Holiday -15%", "Trauma Cases +28%")
- **Action Button:** "View Redistribution Options" → links to redistribution page

#### C. Expiry Timeline (Horizontal Scroll)
- A **horizontal timeline** showing batches expiring in the next 30 days.
- Each batch is a pill-shaped card with: blood group, component, units, days remaining.
- **Color:** Green (>14 days), Amber (7-14 days), Red (<7 days).
- **AI Recommendation:** Small text below each: *"Transfer 5 units to City Hospital — they have a predicted shortage."*

---

### Screen 3: Smart Redistribution & Logistics (`/redistribution`)
**The Action Screen.** Make transferring blood feel like a mission control operation.

#### A. AI Recommendation Cards (Stacked List)
Each card is a **transfer mission card**:
- **From → To:** Visual arrow connector with hospital avatars
- **Blood Details:** Blood group badge (large, color-coded), component, units
- **AI Confidence:** Badge showing confidence % (e.g., "94% Match")
- **Estimated Impact:** "Prevents shortage at City Hospital | Saves 5 units from expiry"
- **Travel Time:** Small map preview + estimated minutes
- **Actions:** 
  - "Approve Transfer" (primary crimson button)
  - "Modify" (secondary outline)
  - "Dismiss" (ghost, red text)
- **Animation:** Cards slide in from the right on load. Approved cards animate out (slide up + fade).

#### B. Active Transfers Tracker (Kanban-style)
- **3 columns:** Pending | In Transit | Completed
- Cards can be dragged between columns (or use buttons to advance status).
- **In Transit cards:** Show a progress bar filling up based on estimated travel time.
- **Completed cards:** Green checkmark animation on entry.

#### C. Transfer Detail Modal
- Full-screen modal (or large drawer) showing:
  - Map visualization (static image or embedded map iframe)
  - Full batch details
  - AI reasoning paragraph
  - Approval chain (who approved, when)
  - Print / PDF export button

---

### Screen 4: Emergency Dispatch Center (`/emergency`)
**The Crisis Screen.** Dark, urgent, focused.

#### A. SOS Broadcast Panel
- **Full-width hero card** with dark gradient background (`slate-900 → crimson-900`).
- **Blood Type Selector:** Large, tappable blood group buttons (A+, O-, etc.) with urgency glow.
- **Units Needed:** Stepper input
- **Priority Level:** Toggle (Standard / Urgent / Critical — Critical triggers red flashing border)
- **Broadcast Button:** Massive crimson button with ripple effect on click.
- **Response Feed:** Live list of hospital responses ("City Hospital: 3 units available", "Metro Blood Bank: En route").

#### B. Live Delivery Tracker
- **Timeline view** of active emergency deliveries.
- Each delivery shows: origin, destination, blood type, units, ETA countdown.
- **Status badges:** Dispatched → In Transit → Delivered.
- **Map dot:** A pulsing dot on a simple map representation.

---

### Screen 5: Settings & API Integrations (`/settings`)
**The Control Screen.** Clean, organized, trustworthy.

#### A. API Key Management
- Copy-paste friendly API key display (masked, with reveal toggle).
- Regenerate key button with confirmation modal.
- Webhook URL input with test button.

#### B. Alert Preferences
- Toggle switches for: Email, SMS, WhatsApp, In-App.
- Threshold sliders: "Alert me when stock drops below __ units" (draggable slider with live value).
- Quiet hours setting.

#### C. Hospital Profile
- Editable form with hospital details.
- Logo upload preview.
- Connected hospitals list with remove option.

---

## 3. Animation & Interaction Specification

### Global Animations
| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transition | Fade in + translateY(10px → 0) | 0.3s | ease-out |
| Card hover | translateY(-4px) + shadow increase | 0.2s | ease-out |
| Card entrance | Staggered fade + scale(0.95 → 1) | 0.4s | spring |
| Number stat | Count-up from 0 | 1.0s | ease-out |
| Alert badge | Pulse (scale 1 → 1.1 → 1) | 2.0s | infinite |
| Loading skeleton | Shimmer sweep left→right | 1.5s | infinite |
| Button press | Scale(0.97) | 0.1s | ease-in |
| Modal open | Scale(0.95 → 1) + fade | 0.2s | spring |
| Drawer open | Slide from right | 0.3s | ease-out |

### Blood-Themed Micro-Interactions
- **Critical alerts:** The card border has a subtle "heartbeat" pulse animation (opacity 0.3 → 1 → 0.3, 2s loop).
- **Emergency button:** Continuous subtle shadow pulse (crimson glow expanding and fading).
- **Successful transfer:** A brief "blood drop" confetti animation (3-4 red droplet SVGs falling).
- **AI thinking:** A brain icon with rotating neural-network-style connecting dots while predictions load.

---

## 4. Responsive Behavior
- **Desktop (1280px+):** Full sidebar, 4-column grids, large charts.
- **Tablet (768px–1279px):** Collapsed sidebar (icons only), 2-column grids, medium charts.
- **Mobile (<768px):** Bottom tab navigation, single-column stack, charts become horizontal scroll cards, FAB remains.

---

## 5. Empty & Error States
- **Empty state:** Illustration (flat vector of a blood bag with a friendly face) + "No active alerts" message + CTA button.
- **Error state:** Red-tinted card with alert icon, retry button, and fallback data display.
- **Loading state:** Skeleton screens that match the layout shape (never generic spinners).

---

## Instructions for Build Agent
* Use **framer-motion** for ALL animations. Do NOT use raw CSS transitions for page/element animations.
* Every chart must have gradient fills, not flat lines.
* Every card must have the glassmorphism treatment (`backdrop-blur`, semi-transparent borders).
* The dashboard MUST have the count-up number animation on KPI cards.
* Use `lucide-react` icons exclusively — no emojis in the final UI (use styled icon components instead).
* Implement a **toast notification system** (using `sonner` or custom) for all actions: "Transfer approved", "Emergency broadcast sent", "Prediction updated".
* Dark mode is OPTIONAL but impressive — if time permits, add a theme toggle using `next-themes`.
