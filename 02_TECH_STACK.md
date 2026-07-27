# 02_TECH_STACK.md

## System Context
You are setting up the complete tech stack for **BloodBridge AI** — a hackathon-ready, deployable prototype with zero Docker/AWS dependency.

---

## Target Technology Stack

### 1. Frontend Architecture
* **Framework:** Next.js 14+ (App Router, React Server Components)
* **Styling:** Tailwind CSS 3.4+ with custom design tokens
* **UI Components:** `shadcn/ui` (built on Radix UI primitives)
* **Animation:** `framer-motion` for page transitions, micro-interactions, and data viz animations
* **Icons:** `lucide-react` + custom SVG blood-themed icons
* **Data Visualization:** `recharts` for demand forecasts, inventory trends, and analytics
* **State Management:** React Context + `zustand` for lightweight global state
* **HTTP Client:** Native `fetch` with a thin wrapper for API calls

### 2. Backend API Layer
* **Framework:** FastAPI (Python 3.10+)
* **API Paradigm:** REST APIs with auto-generated OpenAPI / Swagger docs at `/docs`
* **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
* **CORS:** Configured for Vercel frontend domain
* **Environment:** `python-dotenv` for local dev, platform env vars for production

### 3. Database & Persistence
* **Database:** PostgreSQL 15+ via **Supabase**
* **ORM:** SQLAlchemy 2.0 + SQLModel (Pydantic v2 compatible)
* **Migrations:** Alembic (standard SQLAlchemy migration tool)
* **Connection:** `psycopg2-binary` or `asyncpg` for async support
* **Why Supabase:** Free tier includes PostgreSQL, instant REST API, real-time subscriptions, Row Level Security, and generous bandwidth.

### 4. AI / ML Engine
* **Core Libraries:** Scikit-learn, XGBoost, Pandas, NumPy, Joblib
* **Explainability:** SHAP for feature importance breakdown (lightweight, no heavy dependencies)
* **Model Persistence:** Joblib to serialize trained models (< 5MB each)
* **Note:** Prophet removed in favor of XGBoost Regressor for speed and low memory footprint.
* **Training:** Offline script (`train_models.py`) that runs locally or via a one-time Render job.

### 5. Integration & Notifications
* **Email:** Resend API (free 100 emails/day, perfect for demo)
* **SMS/WhatsApp:** Twilio (trial account for demo purposes)
* **External Integration:** RESTful endpoints for existing HIS/BBMS software
* **Webhooks:** FastAPI webhook endpoints for external system callbacks

### 6. Deployment (Zero Docker, Zero AWS)
* **Frontend:** **Vercel**
  * Connect GitHub repo → auto-deploy on every push
  * Environment variables in Vercel dashboard
  * Custom domain support (optional)
* **Backend:** **Render** (https://render.com)
  * Free tier: Web Service with auto-sleep (wakes on request)
  * PostgreSQL can be Render's managed DB OR connect to Supabase
  * Build command: `pip install -r requirements.txt`
  * Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Alternative Backend:** **Railway** (free $5 credit/month, no sleep, easier Supabase integration)
* **Database:** **Supabase** (free tier, no credit card required)
  * Create project → get connection string → connect via SQLAlchemy
  * Use Supabase Dashboard for manual data inspection

---

## Project Directory Structure
```
bloodbridge-ai/
├── frontend/                 # Next.js 14 App Router
│   ├── app/
│   │   ├── dashboard/
│   │   ├── predictions/
│   │   ├── redistribution/
│   │   ├── emergency/
│   │   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── dashboard/       # Dashboard-specific widgets
│   │   ├── predictions/     # Forecast charts & cards
│   │   ├── redistribution/  # Transfer cards & modals
│   │   └── shared/          # Navbar, Sidebar, Loading, Error
│   ├── lib/
│   │   ├── api.ts           # API client wrapper
│   │   ├── utils.ts         # cn() helper, formatters
│   │   └── constants.ts     # Blood groups, components, colors
│   ├── hooks/
│   │   ├── useInventory.ts
│   │   ├── usePredictions.ts
│   │   └── useRedistribution.ts
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── public/
│   │   └── images/
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── package.json
│
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Settings & env vars
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── inventory.py
│   │   │   ├── predictions.py
│   │   │   ├── redistribution.py
│   │   │   └── emergency.py
│   │   ├── services/
│   │   │   ├── ai_engine.py      # XGBoost inference
│   │   │   ├── shortage_predictor.py
│   │   │   ├── demand_forecaster.py
│   │   │   └── expiry_predictor.py
│   │   └── utils/
│   │       ├── notifications.py
│   │       └── security.py
│   ├── ml_models/            # Trained .joblib models
│   ├── alembic/              # Database migrations
│   ├── scripts/
│   │   ├── seed_data.py      # Generate mock historical data
│   │   └── train_models.py   # Train & save XGBoost models
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
RESEND_API_KEY=re_xxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

---

## Instructions for Build Agent
* Maintain clean separation: Next.js handles presentation, FastAPI handles AI & business logic.
* Ensure `.env.example` files are committed; actual `.env` files are in `.gitignore`.
* Use `python-dotenv` in FastAPI to load `.env` locally; production platforms inject env vars automatically.
* **Frontend aesthetic is NON-NEGOTIABLE** — every screen must feel like a premium healthcare SaaS product.
