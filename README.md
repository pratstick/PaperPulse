# PaperPulse — Auto Research Digest

> A full-stack web app that curates arXiv papers, generates concise AI summaries, ranks relevance, and delivers a personalized daily digest.

---

## Features

- **Topic Onboarding** — Select from curated research topics (LLMs, ML, CV, Robotics, etc.) or create custom ones
- **arXiv Paper Ingestion** — Fetches recent papers from arXiv based on your topics, with deduplication
- **AI Summarization** — Each paper gets a 3–5 sentence summary, key contributions, practical relevance, limitations, and importance score (powered by OpenAI, Anthropic, or a built-in mock)
- **Ranking / Scoring** — Papers are ranked 0–100 using recency, novelty keywords, topic match, and optional LLM scoring
- **Daily Digest** — Top 5–10 papers curated just for you, with estimated reading time
- **Paper Feed** — Browse all papers with search, topic filter, and score filter
- **Paper Detail** — Full metadata, AI summary, related papers, save/read actions
- **Save & Read** — Mark papers as saved for later or already read
- **Scheduled Sync** — Background job refreshes papers every N hours

---

## Tech Stack

| Layer    | Technology                           |
|----------|--------------------------------------|
| Backend  | Python 3.11+, FastAPI, SQLAlchemy    |
| Database | SQLite (local) / PostgreSQL (prod)   |
| LLM      | Mock / OpenAI GPT-4o-mini / Anthropic Claude |
| Papers   | arXiv API (atom feed)                |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| State    | TanStack Query (React Query)         |

---

## Project Structure

```
PaperPulse/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route handlers
│   │   ├── services/       # Business logic (arXiv, LLM, ranking, digest)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── jobs/           # APScheduler background sync
│   │   ├── utils/          # Seed data
│   │   ├── config.py       # Settings (pydantic-settings)
│   │   ├── database.py     # DB engine & session
│   │   └── main.py         # FastAPI app entry point
│   ├── seed.py             # DB seed script
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.tsx          # Research feed
    │   ├── digest/page.tsx   # Daily digest
    │   ├── topics/page.tsx   # Topic management
    │   └── papers/[id]/page.tsx  # Paper detail
    ├── components/
    │   ├── PaperCard.tsx
    │   ├── Providers.tsx
    │   ├── layout/Sidebar.tsx
    │   └── ui/
    ├── lib/
    │   ├── api.ts            # API client
    │   ├── types.ts          # TypeScript types
    │   └── utils.ts
    └── .env.local.example
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set LLM_PROVIDER if desired (default: mock)

# Seed database and default topics
python seed.py

# (Optional) fetch demo papers from arXiv
python seed.py --fetch

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### 3. Fetch Papers

After starting the backend, click **Sync Papers** in the sidebar, or trigger it via the API:

```bash
curl -X POST http://localhost:8000/api/sync/
```

Papers will appear in the feed within seconds (with the mock LLM provider).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Default                          | Description                                  |
|-----------------------|----------------------------------|----------------------------------------------|
| `LLM_PROVIDER`        | `mock`                           | LLM provider: `mock`, `openai`, `anthropic`  |
| `OPENAI_API_KEY`      | _(empty)_                        | Required if `LLM_PROVIDER=openai`            |
| `ANTHROPIC_API_KEY`   | _(empty)_                        | Required if `LLM_PROVIDER=anthropic`         |
| `DATABASE_URL`        | `sqlite:///./paperpulse.db`      | SQLite or PostgreSQL connection string       |
| `ARXIV_MAX_RESULTS`   | `50`                             | Papers to fetch per topic per sync           |
| `SYNC_INTERVAL_HOURS` | `6`                              | Background sync interval in hours           |

### Frontend (`frontend/.env.local`)

| Variable               | Default                        | Description         |
|------------------------|--------------------------------|---------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8000/api`    | Backend API URL     |

---

## LLM Providers

### Mock (default)
No API key needed. Returns deterministic summaries based on paper metadata. Great for local development and demos.

### OpenAI
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```
Uses `gpt-4o-mini` for cost-effective summarization.

### Anthropic
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```
Uses `claude-3-haiku-20240307`.

---

## API Reference

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | `/api/health`                   | Health check                   |
| GET    | `/api/users/me`                 | Get current user               |
| GET    | `/api/topics/`                  | List all topics                |
| POST   | `/api/topics/`                  | Create custom topic            |
| GET    | `/api/topics/subscriptions`     | Get user's subscriptions       |
| POST   | `/api/topics/subscriptions`     | Subscribe to topic             |
| DELETE | `/api/topics/subscriptions/{id}`| Unsubscribe from topic         |
| GET    | `/api/papers/`                  | List papers (with filters)     |
| GET    | `/api/papers/{id}`              | Get paper detail               |
| PATCH  | `/api/papers/{id}/state`        | Update saved/read state        |
| GET    | `/api/papers/{id}/related`      | Get related papers             |
| GET    | `/api/digest/today`             | Get today's digest             |
| POST   | `/api/sync/`                    | Trigger paper sync             |

---

## Using PostgreSQL

For production or persistent storage, switch to PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/paperpulse
```

Install the driver:
```bash
pip install psycopg2-binary
```

---

## Development Notes

- The backend uses `auth-free single-user mode` (User ID = 1). Multi-user support can be added by extending the auth layer.
- Summaries are cached in the database — they won't be regenerated on subsequent syncs.
- The LLM layer is fully pluggable: implement the `LLMProvider` protocol in `app/services/llm_service.py` to add new providers.
- The scheduler runs in-process (APScheduler). For production, consider using Celery or a cron job.

