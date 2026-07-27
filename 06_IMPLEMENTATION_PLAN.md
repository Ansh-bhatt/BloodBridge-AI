# 06_IMPLEMENTATION_PLAN.md

## System Context
Execute the hackathon build plan step-by-step to create a working, deployable prototype of **BloodBridge AI**. No Docker. No AWS. Deploy to Vercel + Render + Supabase.

---

## Pre-Flight Checklist
Before writing code:
1. Create a GitHub repository: `bloodbridge-ai`
2. Create a Supabase project (free tier) at https://supabase.com
3. Create a Render account at https://render.com (or Railway at https://railway.app)
4. Create a Vercel account at https://vercel.com
5. Have Node.js 18+ and Python 3.10+ installed locally

---

## Phase 1: Environment & Project Setup

### 1.1 Initialize Git Repo & Directory Structure
```bash
mkdir bloodbridge-ai && cd bloodbridge-ai
git init
echo "# BloodBridge AI" > README.md
```

### 1.2 Initialize Frontend (Next.js 14 + shadcn/ui)
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend
npx shadcn-ui@latest init  # Select: Default, Slate base color

# Install additional packages
npm install framer-motion recharts lucide-react zustand sonner
npm install -D @types/node @types/react @types/react-dom

# Add shadcn components
npx shadcn-ui@latest add button card badge input label select table tabs dialog drawer skeleton sheet separator avatar dropdown-menu toast progress slider switch textarea

cd ..
```

### 1.3 Initialize Backend (FastAPI)
```bash
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Create requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlmodel==0.0.14
psycopg2-binary==2.9.9
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
pydantic-settings==2.1.0
pandas==2.1.4
numpy==1.26.3
scikit-learn==1.4.0
xgboost==2.0.3
shap==0.44.0
joblib==1.3.2
httpx==0.26.0
EOF

pip install -r requirements.txt

cd ..
```

### 1.4 Configure Supabase Database
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `05_SCHEMA_DESIGN.md` to create enums and tables
3. OR use Alembic (preferred):
```bash
cd backend
alembic init alembic
# Edit alembic.ini: sqlalchemy.url = your_supabase_connection_string
# Edit alembic/env.py to import your SQLModel metadata
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

### 1.5 Environment Files
Create `.env.example` in both frontend and backend. Copy to `.env` and fill in real values.

---

## Phase 2: Backend Core — Database & API

### 2.1 Database Layer
Create `backend/app/database.py`:
```python
from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session
```

Create `backend/app/config.py`:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
```

### 2.2 Models & Schemas
Create `backend/app/models.py` with all SQLModel tables from `05_SCHEMA_DESIGN.md`.

### 2.3 API Routers
Create the following routers in `backend/app/routers/`:

| Router | File | Endpoints |
|--------|------|-----------|
| Auth | `auth.py` | POST `/login`, POST `/register`, GET `/me` |
| Inventory | `inventory.py` | GET `/inventory`, GET `/inventory/{hospital_id}`, POST `/inventory`, PUT `/inventory/{id}` |
| Predictions | `predictions.py` | GET `/predictions/{hospital_id}`, POST `/predictions/refresh` |
| Redistribution | `redistribution.py` | GET `/redistribution`, POST `/redistribution`, PUT `/redistribution/{id}/approve` |
| Emergency | `emergency.py` | POST `/emergency`, GET `/emergency/active`, PUT `/emergency/{id}/respond` |
| Hospitals | `hospitals.py` | GET `/hospitals`, GET `/hospitals/{id}` |

### 2.4 Seed Data Script
Create `backend/scripts/seed_data.py`:
- Insert 5 hospitals with realistic Indian locations
- Generate 6 months of daily `historical_demand` data per hospital per blood group
- Add seasonality patterns (higher on weekends, spikes during festival months)
- Insert current `blood_inventory` with varied stock levels and expiry dates

Run it:
```bash
cd backend
python scripts/seed_data.py
```

### 2.5 Test API Locally
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
- Visit http://localhost:8000/docs
- Test all endpoints with Swagger UI
- Verify database writes in Supabase Table Editor

---

## Phase 3: AI / ML Pipeline

### 3.1 Feature Engineering
Create `backend/app/services/feature_engineering.py`:
```python
def create_features(df):
    """Create ML features from historical demand."""
    df["day_of_week"] = df["date"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["month"] = df["date"].dt.month
    df["day_of_month"] = df["date"].dt.day
    df["rolling_7d_mean"] = df.groupby(["hospital_id", "blood_group"])["units_used"].transform(lambda x: x.rolling(7, min_periods=1).mean())
    df["rolling_30d_mean"] = df.groupby(["hospital_id", "blood_group"])["units_used"].transform(lambda x: x.rolling(30, min_periods=1).mean())
    df["lag_1d"] = df.groupby(["hospital_id", "blood_group"])["units_used"].shift(1)
    df["lag_7d"] = df.groupby(["hospital_id", "blood_group"])["units_used"].shift(7)
    return df
```

### 3.2 Model Training Script
Create `backend/scripts/train_models.py`:
- Load historical demand from database
- Create features
- Train one XGBoost Regressor per (hospital, blood_group) combination
- Target: `units_used` for next 7 days (sum)
- Save models as `.joblib` files in `backend/ml_models/`
- Save a metadata JSON with training date, RMSE, feature list

Run it:
```bash
cd backend
python scripts/train_models.py
```

### 3.3 Inference Service
Create `backend/app/services/ai_engine.py`:
```python
class AIPredictionEngine:
    def __init__(self):
        self.models = self._load_models()

    def predict_demand(self, hospital_id, blood_group, days=7):
        # Load latest features
        # Run model inference
        # Calculate risk score: (predicted_demand - available_stock) / predicted_demand
        # Return prediction + explanation
        pass

    def get_feature_importance(self, model, features):
        # Use SHAP or XGBoost built-in feature importance
        # Return top 3 features with impact scores
        pass

    def generate_redistribution_recommendations(self):
        # Find hospitals with surplus (risk < 0.2)
        # Find hospitals with shortage (risk > 0.6)
        # Match by blood group, minimize distance
        # Return ranked recommendations with confidence
        pass
```

### 3.4 Prediction Endpoint
Create `backend/app/routers/predictions.py`:
- GET `/api/v1/predictions/{hospital_id}` → Returns all predictions for hospital
- POST `/api/v1/predictions/refresh` → Re-runs inference, stores in `ai_predictions` table
- Every prediction response includes `explanation` object

### 3.5 Test AI Endpoints
- Verify predictions return realistic numbers
- Verify explanation JSON is present
- Verify risk scores are between 0 and 1

---

## Phase 4: Frontend — The Aesthetic Dashboard

### 4.1 Global Layout & Navigation
Create `frontend/app/layout.tsx`:
- Root layout with `Inter` font from Google Fonts
- Wrap with providers: ThemeProvider, ToastProvider (sonner)
- Sidebar + TopBar as persistent layout

Create `frontend/components/shared/Sidebar.tsx`:
- Glassmorphism sidebar (`bg-slate-900/95 backdrop-blur-xl`)
- Navigation items with active state (red left border + red tint)
- Collapsible on mobile (sheet/drawer)
- Items: Dashboard, Predictions, Redistribution, Emergency, Settings

Create `frontend/components/shared/TopBar.tsx`:
- Hospital name + logo
- Live pulse indicator (green dot with CSS ripple)
- Notification bell with badge
- User avatar dropdown

### 4.2 Dashboard Page (`/dashboard`)
Create `frontend/app/dashboard/page.tsx`:

**KPI Cards Row:**
- Use `frontend/components/dashboard/KpiCard.tsx`
- Count-up animation using a custom hook (`useCountUp`)
- Each card has: icon in gradient circle, big number, sparkline, label
- Cards: Total Stock (emerald), Shortages (crimson, pulse if >0), Near Expiry (amber), Emergencies (rose)

**Regional Grid:**
- Use `frontend/components/dashboard/RegionalGrid.tsx`
- Bento-style grid of hospital cards
- Each card: name, distance, mini stacked bar of blood groups, circular availability ring
- Click expands to detail drawer

**Inventory Matrix:**
- Use `frontend/components/dashboard/InventoryMatrix.tsx`
- 8×5 grid of blood group + component cells
- Color-coded status dots
- Hover tooltip with exact count + AI prediction
- Click opens detail drawer

**Emergency FAB:**
- Floating button bottom-right
- Crimson gradient, pulsing shadow
- Opens emergency modal

### 4.3 Predictions Page (`/predictions`)
Create `frontend/app/predictions/page.tsx`:

**Demand Forecast Chart:**
- Use Recharts `AreaChart` with gradient fill
- Confidence interval band
- Blood group toggle pills
- Line draw animation on mount

**Risk Score Cards:**
- Grid of cards, one per at-risk blood group
- Semi-circular gauge (custom SVG or use a gauge library)
- AI explanation text
- Feature importance horizontal bars
- "View Options" button linking to redistribution

**Expiry Timeline:**
- Horizontal scrollable timeline
- Pill cards with countdown feel
- AI recommendation text below each

### 4.4 Redistribution Page (`/redistribution`)
Create `frontend/app/redistribution/page.tsx`:

**AI Recommendations:**
- Stacked list of "mission cards"
- From → To with arrow and avatars
- Blood group badge, units, AI confidence
- Estimated impact text
- Approve / Modify / Dismiss buttons
- Framer Motion enter/exit animations

**Active Transfers Kanban:**
- 3 columns: Pending | In Transit | Completed
- Cards show progress (In Transit has filling progress bar)
- Status change buttons

### 4.5 Emergency Page (`/emergency`)
Create `frontend/app/emergency/page.tsx`:

**SOS Panel:**
- Dark gradient background (`slate-900 → rose-950`)
- Large blood group selector buttons
- Units stepper
- Priority toggle (Standard / Urgent / Critical)
- Massive broadcast button with ripple
- Live response feed below

### 4.6 Shared Components (Create These)
- `GlassCard` — The default card wrapper with glassmorphism
- `StatusBadge` — Dot + label badge
- `GradientButton` — Primary CTA with gradient
- `CountUp` — Animated number counter
- `Sparkline` — Mini Recharts line chart
- `CircularProgress` — SVG ring progress
- `LoadingSkeleton` — Layout-matching skeleton screens
- `DetailDrawer` — Slide-in right panel for details
- `ConfirmModal` — Confirmation dialogs

### 4.7 API Integration
Create `frontend/lib/api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiClient(endpoint: string, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const getInventory = (hospitalId: string) => apiClient(`/inventory/${hospitalId}`);
export const getPredictions = (hospitalId: string) => apiClient(`/predictions/${hospitalId}`);
export const getRedistributions = () => apiClient("/redistribution");
export const approveTransfer = (id: string) => apiClient(`/redistribution/${id}/approve`, { method: "PUT" });
```

Create custom hooks:
- `useInventory(hospitalId)`
- `usePredictions(hospitalId)`
- `useRedistributions()`
- `useEmergency()`

### 4.8 Toast Notifications
Use `sonner` for all actions:
- "Transfer approved successfully"
- "Emergency broadcast sent to 4 hospitals"
- "Predictions refreshed"
- "Error: Could not connect to server"

---

## Phase 5: Deployment

### 5.1 Deploy Backend to Render
1. Push backend code to GitHub
2. Go to https://dashboard.render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. Add Environment Variables in Render Dashboard:
   - `DATABASE_URL` (Supabase connection string)
   - `JWT_SECRET_KEY` (generate a strong random string)
   - `CORS_ORIGINS` (your Vercel domain, once deployed)
6. Deploy
7. Test: Visit `https://your-service.onrender.com/docs`

**Note:** Render free tier sleeps after 15 min inactivity. First request after sleep takes ~30s to wake up. For demo, keep hitting the health endpoint or upgrade to paid ($7/mo).

### 5.2 Deploy Frontend to Vercel
1. Push frontend code to GitHub (same repo or separate)
2. Go to https://vercel.com → New Project
3. Import your GitHub repo
4. Settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `next build` (default)
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)
6. Deploy
7. Vercel gives you a `.vercel.app` domain instantly

### 5.3 Update CORS
After frontend deploys, update Render environment variable:
```
CORS_ORIGINS=https://your-frontend.vercel.app
```
Redeploy backend.

### 5.4 Seed Production Data
Run seed script against production database:
```bash
# Update .env to point to production Supabase
cd backend
python scripts/seed_data.py
python scripts/train_models.py
```

### 5.5 Final Verification
- [ ] Frontend loads on Vercel
- [ ] Backend API docs load on Render
- [ ] Dashboard shows KPI cards with real data
- [ ] Predictions page shows charts
- [ ] Redistribution page shows AI recommendations
- [ ] Emergency page can broadcast
- [ ] All animations work (Framer Motion)
- [ ] Toast notifications appear
- [ ] Mobile responsive works

---

## Phase 6: Demo Polish & Hackathon WOW Factors

### 6.1 Add the "Simulate Emergency" Button
On the Dashboard, add a button that:
1. Randomly drops a blood group's inventory to critical level
2. Triggers AI recalculation
3. Shows a new emergency recommendation card sliding in
4. Plays a toast: "AI detected critical O- shortage — redistribution recommended"

### 6.2 Add Real-Time Feel
- Use `setInterval` to poll the backend every 30s for inventory updates
- Show a "Live" badge with pulsing dot when data is fresh
- Animate number changes (old value → new value with color flash)

### 6.3 Add a Demo Mode Toggle
In Settings, add a "Demo Mode" switch that:
- Shows simulated data if backend is sleeping (Render free tier)
- Prevents the UI from looking broken during demo

### 6.4 Performance Check
- Run Lighthouse in Chrome DevTools
- Aim for: Performance > 80, Accessibility > 90, Best Practices > 90, SEO > 80
- Optimize images (use Next.js `<Image>`)
- Ensure no console errors

### 6.5 README.md
Write a compelling README with:
- Project title + tagline
- Screenshot/GIF of dashboard
- Problem statement
- Solution overview
- Tech stack badges
- Local setup instructions
- Deployment links
- Team info

---

## Hackathon Cut Strategy
If running short on time, prioritize in this order:
1. Dashboard with KPI cards + Inventory Matrix
2. Predictions page with at least one chart
3. Working API with seeded data
4. Deployment live
Skip: Emergency page, Settings page, real-time WebSockets.

---

## Troubleshooting Guide

### Supabase Connection Issues
- Ensure connection string uses the **Transaction** pooler for serverless: `postgresql://postgres.[ref]@aws-0-[region].pooler.supabase.com:6543/postgres`
- Or use direct connection: `postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres`

### Render Free Tier Sleeping
- The first request after inactivity will be slow (~30s)
- For demo: hit the health endpoint before presenting, or use Railway (no sleep)

### CORS Errors
- Ensure `CORS_ORIGINS` includes your exact Vercel domain (with `https://`)
- No trailing slash mismatch

### Large ML Models
- If XGBoost models are >50MB, compress with `joblib.dump(model, "model.joblib", compress=3)`
- Or use lighter models (Random Forest with fewer trees)

### Frontend Build Failures
- Ensure `next.config.js` has `output: "export"` ONLY if doing static export
- For SSR (recommended for this app), use default config
- Check that all environment variables start with `NEXT_PUBLIC_` if used in client components

---

## Instructions for Build Agent
* Execute phases sequentially. Do NOT skip Phase 2 (backend) to start Phase 4 (frontend).
* Validate every API endpoint with Swagger UI before building the frontend component that consumes it.
* The frontend aesthetic is the #1 differentiator — spend extra time on animations, gradients, and glassmorphism.
* Deploy EARLY. Do not wait until the last hour. Deploy after Phase 2 and keep updating.
* Test the full user journey: Login → Dashboard → Predictions → Approve Transfer → Check updated inventory.
