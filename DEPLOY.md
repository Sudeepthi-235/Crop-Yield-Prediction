# Deploying CropCast

This project has 3 separate services that all need to be deployed independently:

1. **`ML model/`** — FastAPI + XGBoost model → deploy on **Render**
2. **`bk/`** — Node/Express + MongoDB → deploy on **Render**
3. **`cropcast/`** — React + Vite frontend → deploy on **Vercel**

Deploy in this order (each step needs a URL from the previous one).

---

## 1. MongoDB (data storage)

You need a database the backend can reach from the internet:

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Add a database user + password
3. Under Network Access, allow `0.0.0.0/0` (allow from anywhere)
4. Copy the connection string — this is your `MONGO_URI`

---

## 2. ML Model service (Render)

1. Go to https://render.com → New → Web Service → connect your GitHub repo
2. Settings:
   - **Root Directory:** `ML model`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Deploy, then copy the resulting URL (e.g. `https://cropcast-ml-model.onrender.com`)
4. Test it: visit `https://<your-url>/health` — should return `{"status": "ok", ...}`

*(Or skip steps 1–3 and use the included `render.yaml` — Render will detect it automatically as a "Blueprint" when you create a new Blueprint instance from your repo.)*

---

## 3. Backend (Render)

1. New → Web Service → same repo
2. Settings:
   - **Root Directory:** `bk`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Add these Environment Variables (see `bk/.env.example`):
   - `MONGO_URI` — from step 1
   - `JWT_SECRET` — any long random string
   - `ML_API_URL` — `https://<your-ml-model-url>/predict` (from step 2)
   - `FRONTEND_URL` — you won't have this yet; put a placeholder like `https://placeholder.vercel.app` for now, you'll update it after step 4
   - `NODE_ENV` — `production`
4. Deploy, then copy the resulting URL (e.g. `https://cropcast-backend.onrender.com`)

---

## 4. Frontend (Vercel)

1. Go to https://vercel.com → Add New → Project → import your repo
2. Settings:
   - **Root Directory:** `cropcast`
   - Framework preset: Vite (auto-detected)
3. Add Environment Variable:
   - `VITE_API_URL` — `https://<your-backend-url>` (from step 3, no trailing slash)
4. Deploy, then copy the resulting URL (e.g. `https://cropcast.vercel.app`)

---

## 5. Wire it back together

Go back to the **Render backend service** → Environment → update:
- `FRONTEND_URL` → your real Vercel URL from step 4

Render will auto-redeploy. That's it — all 3 services are now talking to each other over HTTPS.

---

## Notes

- Render's free tier spins down services after inactivity — the first request after idle time can take 30–60 seconds while it wakes up. This is normal.
- The ML model already ships with a pre-trained `models/model.pkl`, so it won't retrain on boot (fast startup).
- No external API keys are required — weather data comes from the free Open-Meteo API, and NDVI is simulated.
