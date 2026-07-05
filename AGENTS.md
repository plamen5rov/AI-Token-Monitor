# AGENTS.md

## AI Token Monitor (ATM)

AI Token Monitor (ATM) is a self-hostable dashboard for tracking usage, costs,
and model-level analytics across multiple AI API providers.

It focuses on:

* simple onboarding via provider templates
* API-key-based setup
* unified cost and usage tracking
* model-level breakdown per provider
* clean, modern dashboard UX

The project is MIT licensed and designed for single-user local or self-hosted
deployment.

---

## Core Product Concept

ATM allows users to:

* Select an AI provider from predefined templates
* Add API keys securely (server-side only)
* Automatically sync usage, cost, and model data
* View analytics per provider and per model
* Compare usage across providers

Supported providers are implemented via adapters.

---

## Core Principles

Always optimize for:

1. Simplicity over abstraction
2. Minimal setup friction
3. Fast local development
4. Clear data flow
5. Maintainable architecture
6. AI-agent-friendly code structure

Avoid overengineering.

---

## Agent Workflow Rules

When building ATM, the agent MUST follow these rules on every session:

1. **Detect and resolve inconsistencies**
   The pre-planning docs (`docs/`) are a starting point, not immutable truth.
   When the agent finds contradictions, outdated assumptions, or implementation
   choices that no longer fit reality, it MUST point them out and ask the user
   for a final verdict before proceeding.

2. **Keep docs in sync with decisions**
   Once a decision is made, update `AGENTS.md` and any other relevant spec
   documents so the project's documented plans match the current direction.
   `AGENTS.md` remains the source of truth.

3. **Log every change**
   Maintain `DONE.md` at the repo root. After every meaningful change (or at
   least after every commit), append a dated entry describing what changed and
   which files were affected. This log is the primary trail for reversing or
   revisiting steps in future sessions.

---

## Tech Stack

## Framework

* Next.js (App Router)
* TypeScript

## Styling

* Tailwind CSS
* shadcn/ui

## Charts

* Recharts

## Database

* SQLite (single local file)

Database access:

* better-sqlite3 (no ORM)

---

## Architecture Overview

Single full-stack Next.js application.

```text
Next.js App Router
    ↓
Server Actions / Route Handlers
    ↓
Provider Adapters
    ↓
SQLite (better-sqlite3)
```

No separate backend service.

No microservices.

No external API layer.

---

## Project Structure

```text
app/
components/
lib/
providers/
templates/
database/
migrations/
types/
```

Keep structure shallow and predictable.

---

## Documentation Structure

Supporting specs and agent instructions are organized under `docs/`:

```text
docs/
├── agents/
│   ├── OPENODE_MASTER_PROMPT.md      # Autonomous build prompt
│   ├── OPENODE_BUILD_AGENT.md        # Build agent instructions
│   └── MVP_ROADMAP_7_PHASES.md       # Implementation roadmap
├── architecture/
│   ├── DATABASE_SCHEMA.md            # SQLite schema
│   ├── DATA_FLOW.md                  # Runtime data flow
│   ├── PROVIDER_ADAPTER_GENERATOR.md # Adapter generation system
│   └── SKILL.md                      # Provider API patterns
└── ui/
    ├── UI_SYSTEM.md                  # Design system
    └── UI_IMPLEMENTATION_PLAN.md     # Component build plan
```

`AGENTS.md` is the source of truth and overrides any conflicting guidance in the
supporting documents.

---

## Provider System

ATM is built around a **provider template system**.

Each provider is defined in `/templates` and instantiated into a provider
adapter.

## Provider Template Concept

A template defines:

* provider name
* base API URL
* authentication method
* supported endpoints
* model list strategy
* pricing strategy

Example:

```text
templates/openai.ts
templates/anthropic.ts
templates/openrouter.ts
templates/groq.ts
```

---

## Provider Adapters

Each provider implements a unified interface:

```ts
fetchUsage()
fetchModels()
fetchPricing()
fetchCosts()
healthCheck()
```

Located in:

```text
providers/
```

Example:

```text
providers/openai.ts
providers/anthropic.ts
providers/openrouter.ts
```

---

## Key Requirement: Model-Level Analytics

ATM must support:

* usage per provider
* usage per model
* cost per model
* token breakdown (input/output)
* historical trends

Each provider adapter must map provider-specific model data into a unified
schema.

---

## Database Schema

SQLite schema must support:

## Providers

* id
* name
* api_key_encrypted
* enabled
* last_sync

## Models

* provider_id
* model_name
* input_price
* output_price

## Usage Records

* provider_id
* model_name
* timestamp
* input_tokens
* output_tokens
* cost

## Sync History

* provider_id
* status
* timestamp
* error_message

## Settings

* refresh_interval
* currency
* dashboard preferences

---

## API Key Handling

* API keys must NEVER be exposed to the client
* API keys must be stored encrypted in SQLite
* all provider requests must be server-side only

---

## Sync System

ATM uses periodic synchronization.

## Sync behavior

* Manual "Sync Now" button
* Optional background sync
* Lazy sync on dashboard load if data is stale

## Sync flow

```text
User triggers sync
    ↓
Provider adapter fetches usage
    ↓
Normalize data
    ↓
Store in SQLite
    ↓
Update last_sync timestamp
```

---

## UI Philosophy

ATM should feel like a modern developer observability tool.

Inspired by:

* Linear
* Vercel
* Grafana
* OpenAI dashboard
* Raycast

Design goals:

* minimal
* dense but readable
* dark-mode first
* fast interactions
* data-first layout

---

## Dashboard Requirements

Core views:

## Overview

* total cost
* usage trends
* active providers
* top models

## Provider View

* per-provider usage
* API key status
* sync history

## Model View

* cost per model
* token usage per model
* performance comparison

## Usage Timeline

* daily / monthly cost graph
* token usage graph

---

## Components

* reusable
* small
* composable

Do not create large monolithic UI components.

---

## State Management

Prefer:

* Server Components
* Server Actions
* URL state

Avoid Redux.

Use Zustand only if absolutely necessary.

---

## Data Fetching Strategy

Prefer server-side fetching via:

* Route Handlers
* Server Actions

Client-side fetching only for interactive UI updates.

---

## SQL Guidelines

* Write SQL manually
* Use prepared statements
* Avoid ORM abstraction layers
* Prefer clarity over clever queries

---

## Performance

* Prefer server rendering
* Avoid unnecessary client-side computation
* Batch provider API requests where possible
* Cache synced results

---

## Security Rules

* Never expose API keys to the browser
* Encrypt API keys in database
* Never log secrets
* All provider communication must happen server-side

---

## Error Handling

* Fail loudly with meaningful errors
* Store sync errors in Sync History table
* Do not silently ignore failed provider syncs

---

## Provider Template Rules

When adding a new provider:

1. Create a template in `/templates`
2. Create an adapter in `/providers`
3. Map provider-specific models into unified schema
4. Ensure sync compatibility with database schema

No provider should bypass this system.

---

## What to Avoid

Do NOT introduce:

* Prisma
* GraphQL
* Microservices
* Event-driven architecture
* Redux
* Complex DI frameworks
* Over-abstracted service layers

Keep architecture direct and transparent.

---

## Guiding Principle

If there are multiple valid implementations:

Choose the one that is:

* simplest
* easiest to debug
* easiest to extend by an AI agent
* least dependent on external libraries

Clarity is more important than extensibility abstractions.

---

## Future Expansion (Allowed)

The architecture should support future features such as:

* model benchmarking
* latency tracking
* provider uptime monitoring
* cost forecasting
* anomaly detection
* usage alerts
* multi-project tracking
* CLI integration

But these should NOT be implemented until needed.
