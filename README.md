# NeoBank — Full-Stack Web Banking Application

A full-stack web banking platform: user registration with email OTP verification, JWT-authenticated login, peer-to-peer money transfers with ACID guarantees, real-time transaction notifications, an AI banking assistant, and embedded video calling. Built phase by phase as a learning project, deployed to a live public stack.

## Live Demo

- **App:** https://neo-bank-omega.vercel.app
- **API:** https://banks-backend-jsda.onrender.com

> The backend runs on Render's free tier, which sleeps after ~15 minutes idle. The first request after a cold start can take 30–60 seconds; subsequent requests are fast.

## Features

- **Registration + email OTP** — sign up, receive a time-limited one-time code by email, and verify before the account is activated. Unverified accounts self-heal on re-registration (a fresh code is reissued rather than blocking the email).
- **JWT authentication** — stateless auth shared across REST and WebSocket connections.
- **Money transfers** — send funds by recipient email. Transfers run inside a database transaction with row-level locking, so the debit, credit, and ledger record are atomic and concurrent transfers can't double-spend. Funds only move between active, verified accounts.
- **Real-time notifications** — recipients are notified of incoming transfers instantly over Socket.IO (room-per-user targeting).
- **AI banking assistant** — a tool-calling agent (LangGraph) that answers account questions using the user's real data. User identity is bound into the tools via closure, so the model is structurally unable to query another user's account. Read-only by design.
- **Video calling** — embedded Jitsi Meet for face-to-face confirmation of a transfer.

## Tech Stack

**Backend** — Node.js, Express, TypeScript, PostgreSQL via Prisma, JWT auth, Socket.IO, LangGraph (`@langchain/langgraph`) for the assistant, Brevo for transactional email.

**Frontend** — React, TypeScript, Vite, Material UI, axios (with auth interceptors), React Router.

**Infrastructure** — Docker / docker-compose for local backend + Postgres; deployed on Vercel (frontend), Render (backend), and Neon (managed Postgres). LLM inference via Groq.

## Project Structure

```
.
├── backend/    # Express + TypeScript API, Prisma schema, services & controllers
├── frontend/   # React + TypeScript app (Vite + MUI)
└── docs/       # API spec, sequence diagrams, and a detailed decisions log
```

The architecture and the reasoning behind every major tradeoff (Postgres-over-Mongo, manual-vs-zod validation, closure-bound agent security, the deployment journey, and more) are documented in [`docs/decisions.md`](docs/decisions.md).

## Running Locally

### Prerequisites
- Node.js 18+
- Docker (optional — used for local Postgres)

### 1. Database
Start a local Postgres with Docker:
```bash
docker compose up db
```
This exposes Postgres on `localhost:5432`. Alternatively, point `DATABASE_URL` at any Postgres instance (e.g. a Neon dev branch).

### 2. Backend
```bash
cd backend
npm install
# create a .env (see variables below)
npx prisma migrate dev   # apply the schema
npm run dev              # → http://localhost:3000
```

Backend environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `OTP_TTL_MINUTES` | OTP validity window (default `10`) |
| `BREVO_API_KEY` | Brevo API key for sending OTP email |
| `EMAIL_FROM` | Verified sender, e.g. `NeoBank <you@gmail.com>` |
| `GROQ_API_KEY` | LLM inference for the assistant |
| `PORT` | Server port (default `3000`) |
| `CORS_ORIGIN` | Allowed frontend origin (production only) |

### 3. Frontend
```bash
cd frontend
npm install
# set VITE_API_URL=http://localhost:3000 (or rely on the local default)
npm run dev              # → http://localhost:5173
```

## Project Status

Deployed and functional end-to-end: registration, OTP verification, login, transfers, real-time notifications, the AI assistant, and video calling all work in production.

**Planned / not yet implemented:** automated tests (Jest + Supertest for the backend, Cypress for E2E) and a CI/CD pipeline were scoped as later phases and are not in the repo yet.

## Author

Saar Nechemia
