-- Phase 10: Gateway request logging.
-- Every request proxied through the gateway is logged with full context:
-- provider, model, tokens, latency, status, cost. Enables real-time
-- visibility that batch sync APIs cannot provide.

CREATE TABLE IF NOT EXISTS request_logs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  status INTEGER,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  virtual_key_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_request_logs_provider ON request_logs(provider);
CREATE INDEX IF NOT EXISTS idx_request_logs_model ON request_logs(model);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_virtual_key_id ON request_logs(virtual_key_id);

CREATE TABLE IF NOT EXISTS virtual_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  budget_usd REAL,
  budget_used_usd REAL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_virtual_keys_key_hash ON virtual_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_virtual_keys_provider ON virtual_keys(provider);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  scope_id TEXT,
  limit_usd REAL NOT NULL,
  period TEXT NOT NULL DEFAULT 'daily',
  used_usd REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);
