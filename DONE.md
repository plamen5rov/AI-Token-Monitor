# DONE.md

Changelog for the AI Token Monitor (ATM) project.

---

## Phase 0 — Project Documentation

- [2026-07-05] Reorganized project documentation: moved spec files into `docs/agents/`, `docs/architecture/`, and `docs/ui/`; added Documentation Structure section to `AGENTS.md`; fixed internal cross-references in agent docs (files modified: AGENTS.md, docs/agents/*, docs/architecture/*, docs/ui/*)
- [2026-07-05] Added Agent Workflow Rules to `AGENTS.md` and agent instruction docs: detect inconsistencies and ask user, keep docs in sync with decisions, log all changes in `DONE.md` (files modified: AGENTS.md, docs/agents/OPENODE_MASTER_PROMPT.md, docs/agents/OPENODE_BUILD_AGENT.md, DONE.md)
- [2026-07-05] Refined Agent Workflow Rules: newer software package versions and working code prevail over pre-planning docs; UI and colors are iterated from a working app, not `.md` files; mirrored the principles into global OpenCode config at `~/.config/opencode/AGENTS.md` (files modified: AGENTS.md, docs/agents/OPENODE_MASTER_PROMPT.md, docs/agents/OPENODE_BUILD_AGENT.md, ~/.config/opencode/AGENTS.md, DONE.md)

---

## Phase 1 — Project Foundation

- [2026-07-05] Initialized Next.js 16 + TypeScript + Tailwind CSS v4 project at repo root; installed shadcn/ui (base-nova preset), `better-sqlite3`, and `next-themes`; created base folder structure (`app/`, `components/`, `lib/`, `providers/`, `templates/`, `database/`, `migrations/`, `types/`); built sidebar/top navigation shell with dark-mode-default theme toggle; verified clean production build with no TypeScript errors (files modified: .gitignore, package.json, package-lock.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, app/layout.tsx, app/page.tsx, app/globals.css, components/theme-provider.tsx, components/theme-toggle.tsx, components/app-shell.tsx, components/ui/button.tsx, lib/utils.ts, components.json; directories created: app, components, lib, providers, templates, database, migrations, types)

---

## Phase 2 — Database Layer

- [2026-07-05] Implemented SQLite database layer using `better-sqlite3`: created migration runner, initial schema SQL for all 6 tables, connection module with WAL and foreign keys, TypeScript entity types, and CRUD helpers for providers/models/usage records/settings; verified initialization and CRUD operations with `scripts/verify-db.ts`; installed `@types/better-sqlite3` and `tsx` dev dependencies (files modified: package.json, package-lock.json, database/index.ts, database/migrate.ts, migrations/001_initial_schema.sql, lib/db.ts, types/index.ts, scripts/verify-db.ts, DONE.md)

---

## Phase 3 — Provider Integration Framework

- [2026-07-05] Implemented provider integration framework: AES-256-GCM API key encryption (`lib/crypto.ts`), `ProviderAdapter` interface and `BaseProvider` abstract class (`providers/base.ts`), OpenAI adapter with `/v1/models` and `/v1/organization/usage/completions` endpoints and hardcoded pricing map for common models (`providers/openai.ts`), adapter factory (`providers/index.ts`), sync log and `getModelByName` CRUD helpers added to `lib/db.ts`, sync engine orchestrating model upsert, usage record creation with cost computation, and sync_log lifecycle (`lib/sync.ts`); verified full sync flow with a mock provider adapter via `scripts/verify-providers.ts` — all assertions passed (models: gpt-4o, gpt-4o-mini; records: 2; total cost: $72.30; sync log status: success; provider.last_sync updated) (files modified: lib/db.ts, lib/crypto.ts, lib/sync.ts, providers/base.ts, providers/openai.ts, providers/index.ts, types/index.ts, scripts/verify-providers.ts, next-env.d.ts, DONE.md)

---

## Phase 4 — Synchronization Engine

- [2026-07-05] Implemented synchronization engine: duplicate protection for usage records via unique index `(provider_id, model_id, timestamp)` with `ON CONFLICT DO UPDATE` replace semantics (`migrations/002_usage_records_dedupe.sql`, updated `createUsageRecord` in `lib/db.ts`); pre-aggregated `usage_daily` rollup populated during sync via `rebuildUsageDaily()` plus `getUsageDaily()` and `getDashboardTotals()` query helpers; sync flow in `lib/sync.ts` now rebuilds daily aggregates after each provider sync; server actions `syncAllAction` and `syncProviderAction` (`app/actions/sync.ts`); reusable client `SyncAllButton`/`SyncOneButton` components (`components/sync-button.tsx`); wired header Sync button to call `syncAllAction`; built sync history page at `/sync` (force-dynamic server component) showing per-provider sync buttons + history table with status badges and durations; added "Sync" nav entry; extended `.gitignore` for `*.sqlite-shm`/`*.sqlite-wal`; verified idempotency and replace semantics end-to-end with `scripts/verify-sync.ts` (re-syncing same bucket does not double counts; growing bucket replaces old value). MVP dedupe decision noted: daily-bucket providers only; per-request providers (Phase 6) will need a different dedupe key. (files modified: components/app-shell.tsx, lib/db.ts, lib/sync.ts, .gitignore, DONE.md; files added: migrations/002_usage_records_dedupe.sql, app/actions/sync.ts, app/sync/page.tsx, components/sync-button.tsx, scripts/verify-sync.ts)

---

## Phase 5 — Dashboard & Analytics

- [2026-07-05] Built analytics dashboard with live data: installed `recharts` (v3.9.2); added dashboard query helpers in `lib/db.ts` — `getDailySeries`, `getMonthlySeries`, `getProviderBreakdown`, `getModelBreakdown`, `getRecentActivity`, `getActiveProvidersCount`, `getRequestsTodayCount`; added `lib/format.ts` (currency, number, timestamp, relative-time formatters); created `components/dashboard/` directory with `MetricCard`, `CostTrendChart` (area chart with daily/monthly toggle), `TokenTrendChart` (stacked area, input vs output), `ProviderBreakdown`, `ModelBreakdown`, `RecentActivity` tables; rewrote `app/page.tsx` as a force-dynamic server component that fetches all data server-side and passes to chart/table components; charts use shadcn v4 oklch CSS variables (`var(--primary)` etc.) for theme-aware colors; all sections include empty-state messaging for fresh installs; verified all queries with `scripts/verify-dashboard.ts` (seeded 90 days × 3 models, confirmed totals, daily/monthly series, provider/model breakdowns, recent activity ordering); build passes clean (route `/` is dynamic `ƒ`). (files modified: app/page.tsx, lib/db.ts, DONE.md, package.json, package-lock.json; files added: lib/format.ts, components/dashboard/metric-card.tsx, components/dashboard/cost-trend-chart.tsx, components/dashboard/token-trend-chart.tsx, components/dashboard/provider-breakdown.tsx, components/dashboard/model-breakdown.tsx, components/dashboard/recent-activity.tsx, scripts/verify-dashboard.ts)

---

## Phase 6 — Multi-Provider Support

- [2026-07-05] Expanded ATM to support three providers (OpenAI, Anthropic, OpenRouter) with full provider management UI: created `templates/index.ts` with `ProviderTemplate` type and template definitions for all 3 providers (name, base URL, auth method, API key prefix/label/help URL, supported endpoints); created `providers/anthropic.ts` adapter (hardcoded model list with per-1K pricing from Claude Platform docs, fetches usage from `/v1/organizations/usage_report/messages` with `group_by[]=model` and `bucket_width=1d`, handles pagination via `next_page`, maps `uncached_input_tokens` + `cached_input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens` → input tokens, computes cost from pricing map, custom `healthCheck()` via usage endpoint with `x-api-key` + `anthropic-version: 2023-06-01` headers); created `providers/openrouter.ts` adapter (fetches models from `GET /api/v1/models` with per-token pricing converted to per-1K, fetches usage from `GET /api/v1/activity` which returns last 30 days with `prompt_tokens`, `completion_tokens`, `reasoning_tokens`, `requests`, and `usage` (cost in USD) per model per day, uses cost directly from API, custom `healthCheck()` via `GET /api/v1/key`); updated `providers/index.ts` factory to handle `"anthropic"` and `"openrouter"` types; added `requestCount` optional field to `NormalizedUsageRecord` type; updated `lib/sync.ts` `syncUsage()` to use `record.requestCount || 1` instead of hardcoded `1`; updated `providers/openai.ts` to pass `num_model_requests` as `requestCount`; created `app/actions/providers.ts` server actions (`addProviderAction`, `deleteProviderAction`, `toggleProviderAction`, `healthCheckAction`, `syncProviderFromProvidersAction`); created `components/provider-form.tsx` (client component with template selector, name input, password-type API key input with help link, inline validation); created `components/provider-actions.tsx` (client component with per-provider Sync, Health Check, Toggle, Delete buttons using `useTransition`); created `app/providers/page.tsx` (force-dynamic server component listing all providers with type badges, status badges, last sync, and action buttons; empty state with template previews); verified with `scripts/verify-providers-phase6.ts` (22 assertions: templates, CRUD for all 3 types, API key encryption/decryption, adapter factory, toggle, delete, multi-provider dashboard aggregation, provider breakdown, disable-doesn't-remove-data, sync-filters-active, Anthropic hardcoded models); build passes clean (`/`, `/providers`, `/sync` all dynamic `ƒ`). (files added: templates/index.ts, providers/anthropic.ts, providers/openrouter.ts, app/actions/providers.ts, components/provider-form.tsx, components/provider-actions.tsx, app/providers/page.tsx, scripts/verify-providers-phase6.ts; files modified: providers/index.ts, providers/openai.ts, types/index.ts, lib/sync.ts, DONE.md)

---

## Process & Tooling

- [2026-07-05] Created `ERROR-LOG.md` at project root and added error-logging principle to workflow rules; logged first entry about Dark Reader hydration mismatch; mirrored the principle into global OpenCode config at `~/.config/opencode/AGENTS.md` (files modified: ERROR-LOG.md, AGENTS.md, docs/agents/OPENODE_MASTER_PROMPT.md, docs/agents/OPENODE_BUILD_AGENT.md, ~/.config/opencode/AGENTS.md, DONE.md)
