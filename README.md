# AI Token Monitor (ATM)

A self-hostable dashboard for tracking usage, costs, and model-level analytics
across multiple AI API providers.

ATM gives you a single pane of glass to monitor how much you're spending on
OpenAI, Anthropic, and OpenRouter — with per-model cost breakdowns, token usage
trends, and sync history.

## Features

- **Multi-provider support** — OpenAI, Anthropic, and OpenRouter adapters
- **Unified dashboard** — total cost, token usage, requests, active providers
- **Cost & token trends** — daily and monthly charts powered by Recharts
- **Per-model breakdown** — see which models cost the most
- **Provider management** — add, enable/disable, health-check, and delete
  providers through the UI
- **Encrypted API keys** — AES-256-GCM encryption, server-side only
- **Sync engine** — manual sync with dedupe protection and sync history
- **Dark mode first** — clean, modern dashboard UX with light/dark toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova) |
| Charts | Recharts v3 |
| Database | SQLite (better-sqlite3, no ORM) |
| Encryption | Node.js crypto (AES-256-GCM) |
| Toasts | Sonner |

## Quick Start

### Prerequisites

- Node.js 22+
- npm 10+

### Installation

```bash
git clone https://github.com/plamen5rov/AI-Token-Monitor.git
cd AI-Token-Monitor
npm install
```

### Configuration

Copy the environment template and set your encryption key:

```bash
cp .env.example .env.local
```

Generate a secure encryption key:

```bash
openssl rand -hex 32
```

Add it to `.env.local`:

```
ENCRYPTION_KEY=your-generated-key-here
```

> If `ENCRYPTION_KEY` is not set, ATM uses a default key and prints a warning.
> This is fine for local development but **not secure** for real API keys.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm run start
```

## Adding a Provider

1. Navigate to **Providers** in the sidebar.
2. Click **Add Provider**.
3. Select a provider type (OpenAI, Anthropic, or OpenRouter).
4. Enter a display name and your API key.
5. Click **Add Provider**.

### API Key Requirements

| Provider | Key Type | Where to Get It |
|----------|---------|----------------|
| OpenAI | Standard API key (`sk-...`) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | **Admin** API key (`sk-ant-admin01-...`) | [console.anthropic.com/settings/admin-keys](https://console.anthropic.com/settings/admin-keys) |
| OpenRouter | **Management** API key (`sk-or-...`) | [openrouter.ai/keys](https://openrouter.ai/keys) |

> Anthropic requires an Admin API key (not a standard API key) to access the
> Usage & Cost Admin API.

> OpenRouter requires a Management API key to access the activity/usage
> endpoints.

## Usage

### Syncing Data

- Click **Sync All** in the top bar to sync all active providers.
- Or use the **Sync** button on individual providers in the Providers page.
- ATM fetches the last 30 days of usage data on each sync.
- Re-syncing the same day replaces (not duplicates) the data.

### Dashboard

- **Overview** — KPI cards, cost/token trends, provider/model breakdowns,
  recent activity
- **Providers** — manage provider connections
- **Sync** — view sync history and trigger syncs

## Project Structure

```
app/              # Next.js App Router pages and server actions
components/       # React components (UI, dashboard, providers)
lib/              # Shared utilities (db, crypto, sync, format)
providers/        # Provider adapters (OpenAI, Anthropic, OpenRouter)
templates/        # Provider template definitions
database/         # SQLite connection and migration runner
migrations/       # SQL migration files
types/            # TypeScript type definitions
scripts/          # Verification scripts
docs/             # Architecture and design documentation
```

## Architecture

```
Next.js App Router
    ↓
Server Actions / Route Handlers
    ↓
Provider Adapters (fetchModels, fetchUsage, healthCheck)
    ↓
SQLite (better-sqlite3)
```

No separate backend. No microservices. No ORM. All provider API calls happen
server-side. API keys are encrypted at rest and never sent to the browser.

## Database

ATM uses a single SQLite file (`atm.sqlite` by default) with six tables:

- `providers` — provider connections with encrypted API keys
- `models` — model metadata and pricing per provider
- `usage_records` — raw usage buckets (deduplicated by provider+model+timestamp)
- `usage_daily` — pre-aggregated daily totals for fast dashboard queries
- `sync_log` — sync run history with status and error messages
- `settings` — key-value settings store

Migrations run automatically on startup. To reset the database, delete the
`atm.sqlite*` files and restart the app.

## Verification Scripts

Each phase has a verification script that seeds test data and runs assertions:

```bash
npx tsx scripts/verify-db.ts
npx tsx scripts/verify-providers.ts
npx tsx scripts/verify-sync.ts
npx tsx scripts/verify-dashboard.ts
npx tsx scripts/verify-providers-phase6.ts
```

## License

MIT
