# 04_OVERALL_DESIGN_RULES.md

## System Context
You are enforcing visual design standards, code style, and UX principles across **BloodBridge AI**. This is a premium healthcare SaaS — every detail matters.

---

## 1. Visual & UI Design System

### A. Color Palette (Extended)

#### Primary Brand Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Medical Crimson | `#DC2626` | `red-600` | Primary actions, urgent alerts, brand accent |
| Crimson Dark | `#991B1B` | `red-800` | Hover states, deep emphasis |
| Crimson Light | `#FEE2E2` | `red-100` | Soft backgrounds, badges |
| Crimson Glow | `rgba(220,38,38,0.15)` | — | Shadow glows, hover auras |

#### Neutral / UI Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Slate Navy | `#0F172A` | `slate-900` | Sidebar, topbar, headings |
| Slate Deep | `#1E293B` | `slate-800` | Card headers, secondary surfaces |
| Slate Medium | `#475569` | `slate-600` | Body text, secondary labels |
| Slate Light | `#94A3B8` | `slate-400` | Captions, placeholders |
| Slate Muted | `#CBD5E1` | `slate-300` | Borders, dividers |
| Canvas | `#F8FAFC` | `slate-50` | Page background |
| Pure White | `#FFFFFF` | `white` | Card surfaces |

#### Semantic Status Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Success | `#10B981` | `emerald-500` | Optimal stock, completed transfers |
| Success Soft | `#D1FAE5` | `emerald-100` | Success backgrounds |
| Warning | `#F59E0B` | `amber-500` | Expiring soon, low stock |
| Warning Soft | `#FEF3C7` | `amber-100` | Warning backgrounds |
| Danger | `#E11D48` | `rose-600` | Severe shortage, emergency |
| Danger Soft | `#FFE4E6` | `rose-100` | Danger backgrounds |
| Info | `#3B82F6` | `blue-500` | Informational, AI insights |
| Info Soft | `#DBEAFE` | `blue-100` | Info backgrounds |

#### Gradient Presets (USE THESE — NO FLAT COLORS ON HERO ELEMENTS)
```css
/* Hero card gradient */
gradient-hero: linear-gradient(135deg, #DC2626 0%, #E11D48 50%, #F43F5E 100%);

/* Glassmorphism card background */
glass-card: rgba(255, 255, 255, 0.75);
glass-border: rgba(255, 255, 255, 0.3);
glass-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);

/* Dark emergency gradient */
emergency-gradient: linear-gradient(135deg, #0F172A 0%, #450A0A 100%);

/* Subtle page background mesh */
page-mesh: radial-gradient(at 0% 0%, rgba(220,38,38,0.05) 0px, transparent 50%),
           radial-gradient(at 100% 100%, rgba(16,185,129,0.05) 0px, transparent 50%);
```

### B. Typography System
- **Font Family:** `Inter` (Google Fonts) or `Geist Sans` (Vercel font). Load weights: 400, 500, 600, 700.
- **Numeric Font:** `Inter` tabular-nums for all stats and counts (prevents jitter during count-up animation).

| Level | Size | Weight | Line Height | Color | Usage |
|-------|------|--------|-------------|-------|-------|
| Display | `text-4xl` | 700 | 1.1 | slate-900 | Hero numbers |
| H1 | `text-2xl` | 700 | 1.2 | slate-900 | Page titles |
| H2 | `text-xl` | 600 | 1.3 | slate-800 | Section headers |
| H3 | `text-lg` | 600 | 1.4 | slate-800 | Card titles |
| Body | `text-sm` | 400 | 1.5 | slate-600 | Paragraphs |
| Caption | `text-xs` | 500 | 1.4 | slate-400 | Labels, timestamps |
| Badge | `text-xs` | 600 | 1 | varies | Status badges |

### C. Spacing System
- Use Tailwind's default scale but be generous. Cards need breathing room.
- **Page padding:** `p-6` (desktop), `p-4` (mobile)
- **Card padding:** `p-6` standard, `p-4` for dense grids
- **Card gap:** `gap-6` between cards
- **Section gap:** `gap-8` between major sections

### D. Border Radius System
| Token | Value | Usage |
|-------|-------|-------|
| Small | `rounded-md` (6px) | Buttons, inputs, badges |
| Medium | `rounded-xl` (12px) | Cards, modals |
| Large | `rounded-2xl` (16px) | Hero cards, feature panels |
| Full | `rounded-full` | Avatars, pills, FAB |

### E. Shadow System
| Token | Value | Usage |
|-------|-------|-------|
| Subtle | `shadow-sm` | Inline elements, badges |
| Card | `shadow-lg shadow-slate-200/50` | Standard cards |
| Elevated | `shadow-xl shadow-slate-300/40` | Hover state, modals |
| Glow (Crimson) | `shadow-lg shadow-red-500/20` | Active alerts, emergency |
| Glow (Emerald) | `shadow-lg shadow-emerald-500/20` | Success states |

---

## 2. Component Design Specifications

### A. Glassmorphism Card (The Default Card)
```
bg-white/80
backdrop-blur-xl
border border-white/40
rounded-xl
shadow-lg shadow-slate-200/50
hover:shadow-xl hover:shadow-slate-300/40
hover:-translate-y-0.5
transition-all duration-200
```

### B. Status Badge
- **Shape:** `rounded-full px-2.5 py-0.5`
- **Variants:**
  - Success: `bg-emerald-100 text-emerald-700 border border-emerald-200`
  - Warning: `bg-amber-100 text-amber-700 border border-amber-200`
  - Danger: `bg-rose-100 text-rose-700 border border-rose-200`
  - Info: `bg-blue-100 text-blue-700 border border-blue-200`
- **With dot:** Small colored dot (8px) before text, `animate-pulse` for active/danger states.

### C. Primary Button
```
bg-gradient-to-r from-red-600 to-rose-600
text-white font-semibold
rounded-lg px-4 py-2.5
shadow-md shadow-red-500/25
hover:shadow-lg hover:shadow-red-500/30
hover:from-red-700 hover:to-rose-700
active:scale-[0.97]
transition-all duration-150
```

### D. Secondary Button
```
bg-white text-slate-700 font-medium
border border-slate-200
rounded-lg px-4 py-2.5
hover:bg-slate-50 hover:border-slate-300
active:scale-[0.97]
transition-all duration-150
```

### E. Danger / Emergency Button
```
bg-gradient-to-r from-rose-600 to-red-600
text-white font-bold
rounded-xl px-6 py-3
shadow-lg shadow-rose-500/30
animate-pulse-slow
hover:shadow-xl hover:shadow-rose-500/40
```

### F. Input Fields
```
bg-white/60 backdrop-blur-sm
border border-slate-200
rounded-lg px-3 py-2.5
text-sm text-slate-800
placeholder:text-slate-400
focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400
transition-all duration-150
```

### G. Sidebar Navigation Item
```
flex items-center gap-3 px-3 py-2.5 rounded-lg
text-sm font-medium text-slate-500
hover:bg-white/60 hover:text-slate-900
active-item: bg-gradient-to-r from-red-50 to-transparent text-red-600 border-l-2 border-red-500
transition-all duration-150
```

---

## 3. Code Quality & Architectural Rules

### A. Type Safety
- **Frontend:** Strict TypeScript. Every API response must have an interface. No `any` types.
- **Backend:** Pydantic v2 models for ALL request/response validation. Use `SQLModel` for ORM + schema unification.

### B. API Design Standards
- Base path: `/api/v1/`
- Standard response envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional human-readable message",
    "error": null
  }
  ```
- Error response:
  ```json
  {
    "success": false,
    "data": null,
    "message": "Something went wrong",
    "error": { "code": "SHORTAGE_PREDICTION_FAILED", "detail": "..." }
  }
  ```

### C. AI Explainability Constraint
- Every prediction endpoint MUST return:
  ```json
  {
    "prediction": { ... },
    "explanation": {
      "top_features": [
        { "feature": "weekend_factor", "impact": 0.42, "direction": "increase" },
        { "feature": "trauma_admissions", "impact": 0.28, "direction": "increase" }
      ],
      "summary": "O+ shortage predicted due to high weekend trauma admissions."
    }
  }
  ```

### D. Error Handling
- **Frontend:** Never crash. Use Error Boundaries. Show toast notifications for all mutations.
- **Backend:** All exceptions caught by FastAPI exception handlers. Return structured error JSON.

### E. Loading States
- **Never** show a blank screen or generic spinner.
- Use **skeleton screens** that match the layout exactly (Shadcn's `Skeleton` component).
- Use **suspense boundaries** around data-heavy sections.

---

## 4. Animation & Motion Guidelines

### A. Framer Motion Patterns
```tsx
// Page transition wrapper
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

// Staggered children
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 }
};

// Hover tap
whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(15,23,42,0.1)" }}
whileTap={{ scale: 0.97 }}
```

### B. CSS Keyframes (Tailwind Config)
Add to `tailwind.config.ts`:
```js
animation: {
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'float': 'float 6s ease-in-out infinite',
  'shimmer': 'shimmer 2s linear infinite',
},
keyframes: {
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
}
```

---

## 5. File Naming & Organization
- **Components:** PascalCase (`InventoryMatrix.tsx`, `RiskScoreCard.tsx`)
- **Hooks:** camelCase with `use` prefix (`useInventory.ts`)
- **Utils:** camelCase (`formatDate.ts`, `cn.ts`)
- **API routes:** kebab-case (`/api/v1/blood-inventory`)
- **CSS:** Tailwind only. No CSS modules unless absolutely necessary for complex animations.

---

## Instructions for Build Agent
* The glassmorphism card style is the DEFAULT for all content containers. Do NOT use flat white cards.
* All primary CTAs must use the gradient red button style.
* Every status must use the dot + badge pattern — no plain text status.
* The UI must feel ALIVE — animations on every entrance, hover feedback on every interactive element, loading states on every async operation.
* Maintain the color discipline: Crimson for brand/urgent, Emerald for success, Amber for warning, Rose for danger. No random colors.
