# OPENODE_BUILD_AGENT.md

## AI Token Monitor (ATM) — Full Build Agent Instructions

This document defines how an AI coding agent (OpenCode) must build the AI Token
Monitor (ATM) project from scratch.

The goal is to generate a fully working, self-hostable application using a
strict minimal architecture.

---

## Project Summary

ATM (AI Token Monitor) is a local-first dashboard that:

* connects to multiple AI API providers
* stores API keys securely
* syncs usage and cost data
* normalizes all provider data into a unified schema
* displays analytics per provider and per model

It is:

* single-user
* MIT licensed
* self-hostable
* simple to deploy
* built as a single Next.js application

---

## Hard Constraints (DO NOT VIOLATE)

## Architecture

* MUST be a single Next.js application
* NO backend service (no FastAPI, no microservices)
* NO separate frontend/backend repos

---

## Database

* MUST use SQLite only
* MUST use `better-sqlite3`
* NO Prisma
* NO ORM layers
* ALL SQL must be handwritten

---

## Provider System

* MUST use adapter pattern
* MUST normalize ALL providers into a single schema
* NO provider-specific database logic

---

## Security

* API keys MUST never be exposed to browser
* All provider calls MUST happen server-side only

---

## UI Stack

* Next.js App Router
* Tailwind CSS
* shadcn/ui
* Recharts for charts

---

## Workflow Rules

The agent MUST follow these rules on every session:

1. **Detect and resolve inconsistencies**
   Pre-planning docs are a starting point, not immutable truth. Newer software
   package versions, discovered constraints, and working code prevail over
   older spec text. When the agent finds contradictions, outdated assumptions,
   or implementation choices that no longer fit reality, it MUST point them
   out and ask the user for a final verdict before proceeding.

2. **Keep docs in sync with decisions**
   Once a decision is made, update `AGENTS.md` and any other relevant spec
   documents so documented plans match the current direction. `AGENTS.md`
   overrides all other docs.

3. **Log every change**
   Maintain `DONE.md` at the repo root. After every meaningful change (or at
   least after every commit), append a dated entry describing what changed and
   which files were affected. This log is the primary trail for reversing or
   revisiting steps in future sessions.

4. **Iterate UI and colors from a working app**
   Design system docs (colors, spacing, components) are starting points. The
   actual UI is tuned once a working app is visible, not from `.md` files alone.

5. **Maintain an error log**
   Every project must have an `ERROR-LOG.md` at root. Read it at session start.
   Log every mistake, bug, or unexpected error with: date, mistake, root cause,
   fix, and lesson learned. This builds a shared knowledge base for future
   sessions.

---

## Core Architecture

```text id="architecture"
Next.js App Router
   ↓
Server Actions / Route Handlers
   ↓
Provider Adapters
   ↓
SQLite (better-sqlite3)
```

---

## Database Schema (MANDATORY)

Agent MUST implement EXACT schema from:

docs/architecture/DATABASE_SCHEMA.md

Tables:

* providers
* models
* usage_records
* usage_daily
* sync_log
* settings

No additional tables unless explicitly approved.

---

## Provider System (MANDATORY)

Agent MUST implement:

## Base interface

```ts id="provider-interface"
interface ProviderAdapter {
  id: string;

  fetchModels(): Promise<ModelRecord[]>;
  fetchUsage(): Promise<NormalizedUsageRecord[]>;
  healthCheck(): Promise<boolean>;
}
```

---

## Required providers (MVP)

1. OpenAI
2. Anthropic
3. OpenRouter

---

## Normalization rule

ALL providers MUST output:

```ts id="normalized-record"
{
  providerId: string;
  modelId: string;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}
```

---

## Build Phases

Agent MUST execute in strict order.

---

## PHASE 1 — Project Setup

Tasks:

* Create Next.js App Router project
* Install dependencies:

  * Tailwind
  * shadcn/ui
  * better-sqlite3
* Setup base layout

Output:

* App runs locally
* Empty dashboard shell

---

## PHASE 2 — Database Layer

Tasks:

* Implement SQLite connection layer
* Create `/database` module
* Implement schema from docs/architecture/DATABASE_SCHEMA.md
* Add migration scripts (manual SQL files)

Output:

* DB can store and query providers + usage records

---

## PHASE 3 — Provider System

Tasks:

* Create `/providers/base.ts`
* Implement OpenAI adapter
* Implement normalization logic

Output:

* OpenAI usage data successfully stored in DB

---

## PHASE 4 — Sync Engine

Tasks:

* Create sync service
* Implement manual "Sync Now"
* Add sync logging

Flow:

```text id="sync-flow"
Trigger → Provider → Normalize → Store → Log
```

Output:

* Working sync pipeline

---

## PHASE 5 — Dashboard (Core UI)

Tasks:

* Overview page
* Provider breakdown
* Usage charts (Recharts)

Metrics:

* total cost
* daily cost
* top provider
* top model

Output:

* Functional analytics dashboard

---

## PHASE 6 — Multi-Provider Expansion

Tasks:

* Add Anthropic adapter
* Add OpenRouter adapter
* Ensure normalization consistency

Output:

* Aggregated multi-provider dashboard

---

## PHASE 7 — UX POLISH

Tasks:

* Provider setup UI
* API key input (encrypted storage)
* Enable/disable providers
* Dark mode polish

Output:

* Usable MVP

---

## UI Requirements

Design must be:

* minimal
* dense but readable
* dark-mode first
* inspired by:

  * Linear
  * Vercel
  * Grafana
  * Raycast

---

## Component Rules

* Keep components small (<300 lines)
* Avoid deep nesting
* Prefer reuse over duplication
* Avoid premature abstraction

---

## State Management Rules

* Prefer Server Components
* Avoid Redux
* Use Zustand only if required

---

## SQL Rules

* ALL SQL must be explicit
* NO ORM
* Use prepared statements only
* NEVER concatenate user input into SQL

---

## Error Handling

* Never silently fail
* Log sync errors into sync_log table
* Show UI errors clearly

---

## Performance Rules

* Use aggregated tables for charts
* Avoid querying raw usage_records for dashboards
* Cache expensive queries where needed

---

## Security Rules

* API keys must be encrypted in DB
* Never expose keys to client
* All provider requests server-side only

---

## Definition of Done (MVP)

MVP is complete when:

* At least 2 providers integrated
* Usage sync works reliably
* Dashboard shows:

  * cost
  * usage
  * provider breakdown
* API keys configurable in UI

---

## Post-MVP (DO NOT BUILD YET)

* forecasting
* anomaly detection
* latency benchmarking
* pricing history tracking
* alerts system
* model ranking system

---

## Guiding Principle

This project must remain:

* simple
* transparent
* minimal
* easy to extend by AI agents

Whenever unsure, choose the simplest implementation.
