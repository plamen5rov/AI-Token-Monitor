# AI Token Monitor (ATM)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)

A self-hostable dashboard for tracking usage, costs, and model-level analytics
across multiple AI API providers.

ATM gives you a single pane of glass to monitor how much you're spending on
OpenAI, Anthropic, and OpenRouter — with per-model cost breakdowns, token usage
trends, and sync history. Twelve additional providers (NVIDIA NIM, Google AI
Studio, Groq, Mistral, Together AI, DeepSeek, Fireworks AI, Perplexity,
DeepInfra, Anyscale, xAI, OpenCode Zen) are supported as model-registry-only —
they don't expose public REST usage analytics, but ATM keeps their model lists
in sync.
All data is stored locally in SQLite; API keys are encrypted at rest and never
sent to the browser.

<!-- TODO: add dashboard screenshots -->
<!-- Recommended: one overview screenshot + one per-page screenshot (Providers, Models, Usage, Sync, Settings) -->
<!-- Store in docs/images/ and reference with relative paths, e.g. ![Overview](./docs/images/overview.png) -->

## Features

- **Multi-provider support** — 15 pre-defined provider templates: OpenAI,
  Anthropic, OpenRouter (full usage tracking), NVIDIA NIM, Google AI Studio,
  Groq, Mistral, Together AI, DeepSeek, Fireworks AI, Perplexity, DeepInfra,
  Anyscale, xAI, and OpenCode Zen (model registry only). See
  [Provider Support](#provider-support) for the full matrix and
  [Adding OpenAI-Compatible Providers](#adding-openai-compatible-providers) for
  how to add more.
- **Unified dashboard** — total cost, token usage, requests, active providers
- **Cost & token trends** — daily and monthly charts powered by Recharts
- **Per-model breakdown** — see which models cost the most
- **Models page** — full model registry with pricing, context window, and
  aggregated usage across all providers
- **Usage page** — detailed per-model token and cost breakdown with KPI cards,
  charts, and a sortable table with totals footer
- **Settings page** — configure refresh interval and display currency
- **Provider management** — add, enable/disable, health-check, and delete
  providers through the UI
- **Encrypted API keys** — AES-256-GCM encryption, server-side only
- **Sync engine** — manual sync with dedupe protection and full sync history
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

#### Environment variables

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM encryption of API keys | Yes (for production) | Dev fallback (with warning) |
| `DATABASE_PATH` | Path to the SQLite database file | No | `atm.sqlite` |

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

## Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/` | KPI cards, cost/token trends, provider/model breakdowns, recent activity |
| Providers | `/providers` | Manage provider connections — add, sync, health-check, toggle, delete |
| Models | `/models` | Per-model pricing and usage table across all providers |
| Usage | `/usage` | Detailed per-model token/cost breakdown with KPI cards, charts, totals |
| Sync | `/sync` | View sync history and trigger syncs |
| Settings | `/settings` | Configure refresh interval and display currency |

## Adding a Provider

1. Navigate to **Providers** in the sidebar.
2. Click **Add Provider**.
3. Select a provider type from the dropdown (15 providers available — see
   [Provider Support](#provider-support) below).
4. Enter a display name and your API key.
5. Click **Add Provider**.

### Provider Support

| Provider | Models | Usage | Cost | Notes |
|----------|:------:|:-----:|:----:|-------|
| OpenAI | ✓ | ✓ | ✓ | Requires Admin key (`sk-admin-...`). Pulls token usage from `/organization/usage/completions` and exact daily spend from `/organization/costs`. |
| Anthropic | ✓ | ✓ | ✓ | Requires Admin key (`sk-ant-admin01-...`) |
| OpenRouter | ✓ | ✓ | ✓ | Requires Management key (`sk-or-...`) |
| NVIDIA NIM | ✓ | — | — | OpenAI-compatible. Sync refreshes the model list only. |
| Google AI Studio | ✓ | — | — | Gemini API. Analytics at aistudio.google.com/usage. Sync refreshes the model list only. |
| Groq | ✓ | — | — | OpenAI-compatible. LPU inference for Llama, Mixtral, etc. |
| Mistral | ✓ | — | — | OpenAI-compatible. Usage at console.mistral.ai/usage. |
| Together AI | ✓ | — | — | OpenAI-compatible. 200+ open-source models. |
| DeepSeek | ✓ | — | — | OpenAI-compatible. DeepSeek-V3, R1, Qwen. |
| Fireworks AI | ✓ | — | — | OpenAI-compatible. Serverless open-source models. |
| Perplexity | ✓ | — | — | OpenAI-compatible. Sonar online models. |
| DeepInfra | ✓ | — | — | OpenAI-compatible. Open-source models. |
| Anyscale | ✓ | — | — | OpenAI-compatible. Llama, Mistral, etc. |
| xAI (Grok) | ✓ | — | — | OpenAI-compatible. Grok models. |
| OpenCode Zen | ✓ | — | — | OpenAI-compatible. Curated, verified GPT, Claude, Gemini, DeepSeek, MiniMax, GLM, Kimi models via opencode.ai/zen. |

### API Key Requirements

| Provider | Key Type | Where to Get It |
|----------|---------|----------------|
| OpenAI | **Admin** API key (`sk-admin-...`) | [platform.openai.com/settings/organization/admin-keys](https://platform.openai.com/settings/organization/admin-keys) |
| Anthropic | **Admin** API key (`sk-ant-admin01-...`) | [console.anthropic.com/settings/admin-keys](https://console.anthropic.com/settings/admin-keys) |
| OpenRouter | **Management** API key (`sk-or-...`) | [openrouter.ai/keys](https://openrouter.ai/keys) |
| NVIDIA NIM | API key (`nvapi-...`) | [build.nvidia.com](https://build.nvidia.com/) |
| Google AI Studio | Gemini API key (`AIza...`) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | API key (`gsk_...`) | [console.groq.com/keys](https://console.groq.com/keys) |
| Mistral | API key | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys/) |
| Together AI | API key | [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) |
| DeepSeek | API key (`sk-...`) | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
| Fireworks AI | API key | [fireworks.ai/account/api-keys](https://fireworks.ai/account/api-keys) |
| Perplexity | API key (`pplx-...`) | [docs.perplexity.ai](https://docs.perplexity.ai/docs/getting-started/getting-started-chat) |
| DeepInfra | API key | [deepinfra.com/dash/api_keys](https://deepinfra.com/dash/api_keys) |
| Anyscale | API key | [app.endpoints.anyscale.com/credentials](https://app.endpoints.anyscale.com/credentials) |
| xAI (Grok) | API key (`xai-...`) | [console.x.ai](https://console.x.ai) |
| OpenCode Zen | API key | [opencode.ai/settings/keys](https://opencode.ai/settings/keys) |

> OpenAI, Anthropic, and OpenRouter require admin/management keys — standard API
> keys cannot access usage/billing endpoints and will return **403 Forbidden**.
> All other providers accept a standard API key for their models endpoint; no
> admin key is needed because usage analytics are not exposed through their
> public APIs.

## Adding OpenAI-Compatible Providers

ATM uses a single `OpenAICompatibleProvider` adapter
([`providers/openai-compatible.ts`](providers/openai-compatible.ts)) for any
provider that:

- Exposes `GET ${baseUrl}/models` returning `{ data: [{ id, ... }] }`
- Accepts `Authorization: Bearer <key>` (or `x-api-key` / `x-goog-api-key`)

To add a new OpenAI-compatible provider:

1. Add a template entry in [`templates/index.ts`](templates/index.ts) with
   `type`, `displayName`, `baseUrl`, `authMethod`, and `supportsUsage: false`.
2. Add the `type` string to `OPENAI_COMPATIBLE_TYPES` in
   [`providers/index.ts`](providers/index.ts).
3. Optionally add a badge color in `typeBadgeClass()` in
   [`app/providers/page.tsx`](app/providers/page.tsx).

No new adapter file is needed — the generic adapter handles fetchModels,
fetchUsage (returns `[]`), and healthCheck automatically using the template's
`baseUrl` and `authMethod`.

For providers with a **public usage analytics endpoint** (like OpenAI's
`/organization/usage/completions` and `/organization/costs`), write a dedicated adapter in
`providers/<name>.ts` implementing `fetchUsage()` and add a `case` to the
factory in `providers/index.ts`.

## Usage

### Syncing Data

- Click **Sync All** in the top bar to sync all active providers.
- Or use the **Sync** button on individual providers in the Providers page.
- ATM fetches the last 30 days of usage data on each sync.
- Re-syncing the same day replaces (not duplicates) the data — the sync engine
  deduplicates by `provider_id + model_id + timestamp`.

## Architecture & Data Flow

```
Next.js App Router
    ↓
Server Actions / Route Handlers
    ↓
Provider Adapters (fetchModels, fetchUsage, healthCheck)
    ↓
SQLite (better-sqlite3)
```

All data in ATM follows one strict pipeline:

```
Provider API → Adapter → Normalizer → Database → Aggregator → UI
```

No UI component is allowed to bypass this flow. No separate backend. No
microservices. No ORM. All provider API calls happen server-side. API keys are
encrypted at rest and never sent to the browser.

## Database

ATM uses a single SQLite file (`atm.sqlite` by default) with six tables:

- `providers` — provider connections with encrypted API keys
- `models` — model metadata and pricing per provider
- `usage_records` — raw usage buckets (deduplicated by provider+model+timestamp)
- `usage_daily` — pre-aggregated daily totals for fast dashboard queries
- `sync_log` — sync run history with status and error messages
- `settings` — key-value settings store

Migrations run automatically on startup.

> **Reset the database:** Delete the `atm.sqlite*` files and restart the app.
> A fresh schema will be created on the next launch.

## Troubleshooting

### 403 Forbidden when syncing

All three providers require **admin/management** API keys — standard API keys
cannot access usage/billing endpoints. See the
[API Key Requirements](#api-key-requirements) table above to create the correct
key type for your provider.

### `ByteString` / non-Latin-1 character error when syncing

The API key pasted from a web page likely contains invisible Unicode characters
(zero-width spaces `U+200B–U+200F`, BOM `U+FEFF`, non-breaking spaces `U+00A0`).
HTTP headers must be Latin-1 (0–255), so `fetch()` rejects them. ATM
automatically strips these characters on save — if you hit this with an older
build, delete the provider and re-add the key, or update to the latest commit.

### `FOREIGN KEY constraint failed` when deleting a provider

Providers have child rows in `models`, `usage_records`, `usage_daily`, and
`sync_log`. The latest `deleteProvider()` removes child rows in a transaction
before deleting the provider. If you hit this, update to the latest commit and
restart the dev server (the running server may still hold an old DB handle).

### `ReferenceError: SyncResult is not defined` when adding a provider

This was caused by an invalid `export type { SyncResult }` re-export in a
`"use server"` file. Fixed in the latest commit — update your local copy.

### Dark Reader console warnings (hydration mismatch)

The Dark Reader browser extension injects inline styles into SVG icons before
React hydrates, causing a dev-only hydration warning. This is harmless —
disable Dark Reader on `localhost` or ignore the warning in development.

### `NOT NULL constraint failed: usage_records.timestamp`

A provider returned a usage item with a missing or invalid date field.
The OpenRouter adapter now skips items with missing dates, and the sync engine
adds a defensive `Number.isFinite(timestamp)` check before inserting. Update to
the latest commit if you hit this.

## Project Structure

```
app/              # Next.js App Router pages and server actions
components/       # React components (UI, dashboard, providers)
lib/              # Shared utilities (db, crypto, sync, format)
providers/        # Provider adapters (OpenAI, Anthropic, OpenRouter, Google, OpenAICompatible)
templates/        # Provider template definitions
database/         # SQLite connection and migration runner
migrations/       # SQL migration files
types/            # TypeScript type definitions
scripts/          # Verification scripts
docs/             # Architecture and design documentation
```

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

MIT — see [LICENSE](LICENSE) for details.
