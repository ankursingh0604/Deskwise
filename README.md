# Deskwise

Deskwise is a multi-tenant AI receptionist platform. A business signs up, configures an AI agent (business hours, services, FAQ, greeting message), and gets a public chat link customers can use to ask questions — answered by an LLM that only draws on the business's own configured information.

**Live app:** [deskwise-rho.vercel.app](https://deskwise-rho.vercel.app)
**Live API:** [deskwise-s7c5.onrender.com](https://deskwise-s7c5.onrender.com)

## Features

- **Multi-tenant organizations** — each business is an `Organization` with owner/staff roles (`OrgMember`)
- **JWT auth** — access tokens (30 min) + refresh tokens (7 days), with a `type` claim to prevent refresh-token misuse
- **AI receptionist** — per-org configurable agent (`AgentConfig`) backed by Groq (`openai/gpt-oss-120b`), with a system prompt that explicitly instructs the model not to invent business details it wasn't given
- **Public chat widget** — unauthenticated `/chat/:orgId` route customers use to talk to the AI receptionist, with persisted conversation history
- **Stripe billing** — subscription checkout (Starter/Pro plans) with signature-verified webhooks for plan upgrades/downgrades
- **Postgres + Alembic** — versioned schema migrations

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy, Alembic, Postgres |
| Auth | JWT (`python-jose`), bcrypt (`passlib`) |
| AI | Groq API |
| Billing | Stripe (checkout + webhooks) |
| Frontend | React 19, Vite, React Router |
| Deployment | Render (backend + Postgres), Vercel (frontend) |

## Project structure

```
backend/
  app/
    auth/              # JWT, password hashing, org membership dependencies
    main.py            # FastAPI app, CORS, router registration
    models.py          # SQLAlchemy models
    schemas.py         # Pydantic request/response schemas
    config.py          # env-driven settings
    ai_client.py        # Groq client + system prompt builder
    chat_router.py       # public chat endpoint
    agent_config_router.py
    billing_router.py    # Stripe checkout + webhook
  alembic/             # migrations
  Dockerfile

frontend/
  src/
    api/client.js       # axios instance, all API calls
    context/AuthContext.jsx
    pages/              # Login, Signup, Dashboard, Billing, PublicChat
  vercel.json           # SPA rewrite so client-side routes survive direct load/refresh
```

## Local development

### Prerequisites
- Docker + Docker Compose
- Node.js 18+
- A Groq API key and Stripe test-mode keys

### Backend

1. Copy the env template and fill in real values:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Start Postgres + backend:
   ```bash
   docker compose up -d --build
   ```
3. Run migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```
4. API is live at `http://localhost:8000` — check `http://localhost:8000/health`

### Frontend

1. Copy the env template:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
2. Install and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. App is live at `http://localhost:5173`

### Stripe webhooks locally

```bash
stripe listen --forward-to localhost:8000/webhooks/stripe
```
Copy the `whsec_...` secret it prints into `backend/.env` as `STRIPE_WEBHOOK_SECRET`. Note this secret is regenerated each time you run `stripe listen`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signing secret for access/refresh tokens |
| `JWT_ALGORITHM` | Default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Default `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Default `7` |
| `GROQ_API_KEY` | Groq API key for the AI receptionist |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | Stripe Price IDs for each plan |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `FRONTEND_URL` | Used to build Stripe checkout success/cancel redirect URLs |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API (defaults to `http://localhost:8000` if unset) |

## Deployment

- **Backend** is deployed on Render as a Docker web service, connected to a Render-managed Postgres instance in the same region. Env vars are set directly in Render's dashboard (not read from any committed file).
- **Frontend** is deployed on Vercel with root directory `frontend`. `VITE_API_BASE_URL` is set in Vercel's project env vars and baked in at build time, so it requires a redeploy to change. `vercel.json` adds a rewrite rule so client-side routes (`/dashboard`, `/chat/:orgId`, etc.) don't 404 on direct load or refresh.
- Both platforms' env vars must stay in sync on origin URLs: Render's `CORS_ORIGINS`/`FRONTEND_URL` must match the live Vercel URL exactly, and Vercel's `VITE_API_BASE_URL` must match the live Render URL.

## Known gaps

- `plan_tier` is tracked and billed via Stripe but not yet enforced anywhere in the chat logic — all orgs currently get identical AI receptionist behavior regardless of plan.
- The Stripe webhook endpoint should be registered separately in the Stripe dashboard pointing at the production backend URL, with its own signing secret (distinct from the local CLI's).