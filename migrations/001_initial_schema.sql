CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER,
  last_sync INTEGER
);

CREATE TABLE IF NOT EXISTS models (
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

CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_id TEXT,
  timestamp INTEGER NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens),
  cost_usd REAL DEFAULT 0,
  request_count INTEGER DEFAULT 1,
  raw_payload TEXT,
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (model_id) REFERENCES models(id)
);

CREATE TABLE IF NOT EXISTS usage_daily (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  provider_id TEXT,
  model_id TEXT,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  total_requests INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at INTEGER,
  finished_at INTEGER,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_records_provider_id ON usage_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_model_id ON usage_records(model_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_daily_date ON usage_daily(date);
CREATE INDEX IF NOT EXISTS idx_usage_daily_provider_id ON usage_daily(provider_id);
CREATE INDEX IF NOT EXISTS idx_usage_daily_model_id ON usage_daily(model_id);
