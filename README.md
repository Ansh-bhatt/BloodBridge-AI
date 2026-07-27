# BloodBridge AI

AI-powered blood supply optimization for hospital networks. BloodBridge forecasts demand, explains shortage risk, recommends redistribution, and coordinates emergency blood requests.

## Local development

1. Copy `backend/.env.example` to `backend/.env` and configure a PostgreSQL/Supabase connection.
2. Install backend dependencies with `python3 -m pip install -r backend/requirements.txt`.
3. Run the API with `uvicorn app.main:app --reload --port 8000` from `backend`.
4. Copy `frontend/.env.example` to `frontend/.env.local`, then run `npm run dev` from `frontend`.

Deployment targets: Vercel (frontend), Render (FastAPI), and Supabase (PostgreSQL). No Docker or AWS required.
