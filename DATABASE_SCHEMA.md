# DATABASE_SCHEMA.md

## AI Token Monitor (ATM) — Normalized Database Schema

This schema defines a unified, provider-agnostic data model for tracking AI API
usage, costs, models, and synchronization across multiple providers.

The system is designed so that **all providers normalize into a single canonical
structure**.

---

## Core Design Principle

All provider data must be normalized into:

```text id="core-model"
Provider → Model → Usage Record
```

No provider-specific schema is allowed in the database layer.

---

## Tables Overview

## 1. providers

Stores API-connected AI providers.

```sql id="providers-table"
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- openai, anthropic, openrouter, google, etc.

  api_key_encrypted TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,

  created_at INTEGER,
  last_sync INTEGER
);
```

---

## 2. models

Normalized model catalog across providers.

```sql id="models-table"
CREATE TABLE models (
  id TEXT PRIMARY KEY,

  provider_id TEXT NOT NULL,

  name TEXT NOT NULL,
  display_name TEXT,

  input_price_per_1k REAL DEFAULT 0,
  output_price_per_1k REAL DEFAULT 0,

  context_window INTEGER DEFAULT 0,

  is_active INTEGER DEFAULT 1,

  FOREIGN KEY (provider_id) REFERENCES providers(id)
);
```

---

## 3. usage_records (core fact table)

The most important table in ATM.

Stores every usage event normalized across providers.

```sql id="usage-table"
CREATE TABLE usage_records (
  id TEXT PRIMARY KEY,

  provider_id TEXT NOT NULL,
  model_id TEXT,

  timestamp INTEGER NOT NULL,

  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens),

  cost_usd REAL DEFAULT 0,

  request_count INTEGER DEFAULT 1,

  raw_payload TEXT, -- optional provider debug data

  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (model_id) REFERENCES models(id)
);
```

---

## 4. usage_daily (performance optimization layer)

Pre-aggregated analytics for fast dashboards.

```sql id="daily-table"
CREATE TABLE usage_daily (
  id TEXT PRIMARY KEY,

  date TEXT NOT NULL, -- YYYY-MM-DD

  provider_id TEXT,
  model_id TEXT,

  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  total_requests INTEGER DEFAULT 0
);
```

---

## 5. sync_log

Tracks provider sync operations.

```sql id="sync-table"
CREATE TABLE sync_log (
  id TEXT PRIMARY KEY,

  provider_id TEXT NOT NULL,

  status TEXT NOT NULL, -- success | error | partial

  started_at INTEGER,
  finished_at INTEGER,

  error_message TEXT
);
```

---

## 6. settings

Simple key-value configuration store.

```sql id="settings-table"
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## Data Normalization Rules

All provider adapters MUST convert raw API data into:

```ts id="normalized-usage"
type NormalizedUsageRecord = {
  providerId: string;
  modelId: string;

  timestamp: number;

  inputTokens: number;
  outputTokens: number;

  costUSD: number;
};
```

---

## Key Constraints

* No provider-specific tables allowed
* No raw API responses stored as primary data
* All raw data is optional and stored only for debugging (`raw_payload`)
* Cost must always be computed or normalized into USD

---

## Performance Rules

* Use `usage_daily` for dashboards
* Never aggregate raw `usage_records` in UI queries
* Index:

  * provider_id
  * model_id
  * timestamp

---

## Guiding Principle

This database is not a log of APIs.

It is a **normalized observability layer for AI usage.**
