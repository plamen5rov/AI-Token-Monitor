# DATA_FLOW.md

## AI Token Monitor (ATM) — Data Flow Specification

This document defines how data moves through the system from AI providers →
database → UI.

It is the **single source of truth for understanding how ATM works internally at
runtime**.

---

## Core Principle

All data in ATM follows one strict pipeline:

```text id="core-flow"
Provider API → Adapter → Normalizer → Database → Aggregator → UI
```

No UI component is allowed to bypass this flow.

---

## 1. Provider Layer (External APIs)

Each provider (OpenAI, Anthropic, OpenRouter, NVIDIA NIM, Google AI Studio,
Groq, Mistral, Together AI, DeepSeek, Fireworks AI, Perplexity, DeepInfra,
Anyscale, xAI, OpenCode Zen, etc.) exposes different:

* authentication methods
* endpoints
* response formats
* token accounting models

### Example inputs

```json id="openai-response"
{
  "model": "gpt-4o",
  "usage": {
    "prompt_tokens": 120,
    "completion_tokens": 300
  }
}
```

```json id="anthropic-response"
{
  "model": "claude-3-5-sonnet",
  "usage": {
    "input_tokens": 120,
    "output_tokens": 300
  }
}
```

---

## 2. Provider Adapter Layer

Each provider has a dedicated adapter in `/providers`.

### Responsibility

Convert raw API responses into a unified format.

### Output MUST ALWAYS be

```ts id="normalized-output"
{
  providerId: string,
  modelId: string,

  timestamp: number,

  inputTokens: number,
  outputTokens: number,

  costUSD: number
}
```

---

## 3. Normalization Layer

This is where all inconsistencies are resolved.

## Key transformations

### Token normalization

| Provider   | Input         | Output            | ATM Standard |
| ---------- | ------------- | ----------------- | ------------ |
| OpenAI     | prompt_tokens | completion_tokens | input/output |
| Anthropic  | input_tokens  | output_tokens     | input/output |
| OpenRouter | prompt_tokens | completion_tokens | input/output |

---

### Model normalization

Raw model names must be mapped to internal model IDs:

```text id="model-map"
gpt-4o → openai:gpt-4o
claude-3-5-sonnet → anthropic:claude-3-5-sonnet
```

---

### Cost normalization

If provider does NOT return cost:

```text
cost = (input_tokens / 1000 * input_price) +
       (output_tokens / 1000 * output_price)
```

If a provider returns exact cost separately from token usage, prefer exact cost.
For OpenAI, `/organization/usage/completions` provides token/request buckets and
`/organization/costs` provides exact daily spend. ATM stores OpenAI token rows
with zero estimated cost and adds separate exact cost rows to avoid
double-counting.

---

## 4. Database Layer (SQLite)

All normalized data is stored in:

## usage_records (primary fact table)

```text id="db-store"
normalized_usage_record → usage_records
```

Each record represents ONE completed API interaction.

---

## Optional aggregation

After insertion:

```text id="aggregation"
usage_records → usage_daily (aggregation job)
```

This is used for fast dashboards.

---

## 5. Sync Flow (critical system behavior)

Triggered manually or via scheduled sync.

```text id="sync-flow"
User clicks "Sync"
    ↓
Provider Adapter executes fetchUsage()
    ↓
Raw API response received
    ↓
Normalization layer transforms data
    ↓
Compute cost (if missing)
    ↓
Insert into usage_records
    ↓
Update usage_daily aggregates
    ↓
Write sync_log entry
```

---

## 6. UI Data Flow

The UI NEVER talks to providers directly.

It only reads from SQLite.

### UI reads

## Overview page

* usage_daily (fast aggregates)

## Provider page

* filtered usage_records by provider_id

## Model page

* grouped usage_records by model_id

## Charts

* usage_daily preferred
* fallback: aggregated SQL queries on usage_records

---

## 7. Data Freshness Rules

ATM supports 3 states:

## Fresh

* last sync < 30 min
* UI shows normal data

## Stale

* last sync > 30 min
* UI shows warning badge

## Outdated

* last sync failed
* UI shows error state

---

## 8. Sync Ownership Rule

Only ONE system is allowed to write usage data:

✔ Provider sync engine
✖ UI components
✖ client-side fetches
✖ background React logic

---

## 9. Error Flow

If provider sync fails:

```text id="error-flow"
Provider API fails
    ↓
Adapter catches error
    ↓
sync_log entry created (status = error)
    ↓
UI shows last successful data
```

No partial UI corruption is allowed.

---

## 10. Data Integrity Rules

* No duplicate usage_records (id must be unique)
* No direct provider writes to DB
* No client-side mutation of usage data
* All timestamps must be UNIX milliseconds

---

## 11. Mental Model (important)

Think of ATM as:

> A **telemetry pipeline**, not a dashboard

Data flows in ONE direction:

```text id="one-direction"
External APIs → Normalized Store → Aggregated Views → UI
```

Never reverse this flow.

---

## 12. Guiding Principle

If you are unsure where logic belongs:

* Provider API logic → `/providers`
* Transformation logic → normalization layer
* Storage logic → `/database`
* Visualization → UI only

Never mix these layers.
