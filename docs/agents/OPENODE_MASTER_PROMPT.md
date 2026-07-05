# OPENCODE MASTER PROMPT — AI TOKEN MONITOR (ATM)

You are an autonomous senior full-stack engineer operating inside the OpenCode
environment.

Your task is to generate a complete, production-ready MVP of the **AI Token
Monitor (ATM)** system.

---

## 0. Project Overview

ATM (AI Token Monitor) is a local-first, self-hostable dashboard that tracks:

* AI API usage across multiple providers
* token consumption (input/output)
* cost estimation and aggregation
* model-level analytics
* provider-level comparison

It supports multiple AI providers via adapters (OpenAI, Anthropic, OpenRouter,
etc.).

The system must normalize all provider data into a unified internal schema.

---

## 1. HARD CONSTRAINTS (NON-NEGOTIABLE)

## Architecture

* MUST use Next.js (App Router)
* MUST be a single repository
* NO separate backend services
* NO microservices
* NO external API layer

---

## Database

* MUST use SQLite only
* MUST use `better-sqlite3`
* NO ORM (Prisma, Drizzle, TypeORM are forbidden)
* ALL SQL must be handwritten

---

## Security

* API keys MUST NEVER be exposed to client-side code
* All provider communication MUST happen server-side only

---

## UI Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Recharts

---

## 2. ARCHITECTURE MODEL

Use this strict data flow:

```text id="architecture"
Provider API → Adapter → Normalizer → SQLite → Aggregation Layer → UI
```

No component may bypass this pipeline.

---

## 3. REQUIRED DOCUMENTS (YOU MUST FOLLOW THEM)

You must strictly follow:

* AGENTS.md (system rules)
* docs/architecture/DATABASE_SCHEMA.md (data model)
* docs/architecture/DATA_FLOW.md (runtime behavior)
* docs/ui/UI_SYSTEM.md (design system)
* docs/ui/UI_IMPLEMENTATION_PLAN.md (component plan)

If any conflict exists:
👉 AGENTS.md overrides all

---

## 4. DATABASE RULES

You MUST implement exactly this schema:

Tables:

* providers
* models
* usage_records
* usage_daily
* sync_log
* settings

Rules:

* No additional tables without explicit necessity
* No provider-specific schema
* No storing raw API responses as primary data

---

## 5. PROVIDER SYSTEM

You must implement a unified adapter system.

## Required interface

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

* OpenAI
* Anthropic
* OpenRouter

---

## Normalized output format

```ts id="normalized"
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

## 6. BUILD PHASES (STRICT ORDER)

You MUST follow this order exactly:

---

## PHASE 1 — Project Initialization

* Create Next.js App Router project
* Install dependencies:

  * Tailwind CSS
  * shadcn/ui
  * better-sqlite3
* Create base layout

OUTPUT:

* App runs locally with empty dashboard

---

## PHASE 2 — Database Layer

* Implement SQLite connection
* Implement full schema from docs/architecture/DATABASE_SCHEMA.md
* Create migration system using raw SQL files

OUTPUT:

* CRUD access to providers and usage records

---

## PHASE 3 — Provider System

* Implement base adapter
* Implement OpenAI provider
* Normalize OpenAI usage data

OUTPUT:

* OpenAI usage stored in SQLite

---

## PHASE 4 — Sync Engine

* Implement sync service
* Add "Sync Now" button
* Implement sync logging

FLOW:

```text id="sync-flow"
User triggers sync → Provider fetch → Normalize → Store → Log
```

OUTPUT:

* working ingestion pipeline

---

## PHASE 5 — Dashboard UI

* Implement Overview page
* Metric cards:

  * total cost
  * tokens used
  * active providers
* Charts using Recharts
* Provider breakdown view

OUTPUT:

* functional analytics dashboard

---

## PHASE 6 — Multi-Provider Support

* Add Anthropic adapter
* Add OpenRouter adapter
* Ensure all providers normalize correctly

OUTPUT:

* multi-provider aggregation working

---

## PHASE 7 — UI POLISH

* Provider management UI
* API key input (secure storage)
* Enable/disable providers
* Dark/light theme toggle
* Toast notifications

OUTPUT:

* usable MVP product

---

## 7. UI REQUIREMENTS

Design must follow:

* dark mode first (default)
* light mode optional
* minimal and elegant
* inspired by:

  * Linear
  * Vercel
  * Grafana
  * OpenAI dashboards

No flashy UI.

No decorative elements.

---

## 8. COMPONENT RULES

* Components must be small (<300 lines)
* Use composition, not inheritance
* Prefer shadcn/ui components
* No UI logic in backend files

---

## 9. STATE MANAGEMENT RULES

* Prefer Server Components
* Use Server Actions where possible
* Avoid Redux entirely
* Use Zustand only if absolutely required

---

## 10. DATA INTEGRITY RULES

* No duplicate usage records
* All timestamps must be UNIX ms
* No direct provider writes to database
* All writes must go through sync engine

---

## 11. PERFORMANCE RULES

* Use aggregated tables (usage_daily) for charts
* Avoid heavy queries on usage_records in UI
* Cache computed values where possible

---

## 12. ERROR HANDLING

* Never silently fail
* Log all sync failures into sync_log
* UI must show last known good state

---

## 13. DEFINITION OF DONE (MVP)

The project is complete when:

* At least 2 providers fully working
* Sync system functional
* Dashboard shows:

  * cost
  * usage
  * provider breakdown
* API keys configurable in UI
* Data persists in SQLite

---

## 14. POST-MVP FEATURES (DO NOT IMPLEMENT)

* forecasting
* anomaly detection
* pricing history tracking
* latency benchmarking
* alerts system
* AI recommendations engine

---

## 15. GUIDING PRINCIPLE

Always choose:

* simplest implementation
* minimal dependencies
* clear code over abstraction
* explicit logic over magic

This project prioritizes:
👉 understandability over cleverness
👉 control over automation
👉 clarity over scalability premature optimization

---

## END OF PROMPT
