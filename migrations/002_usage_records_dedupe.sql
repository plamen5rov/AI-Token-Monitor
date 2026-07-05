-- Phase 4: Duplicate protection for usage records.
-- OpenAI usage sync returns daily aggregate buckets keyed by (provider_id,
-- model_id, timestamp). Re-syncing the same day would otherwise double-insert.
-- ON CONFLICT DO UPDATE uses replace semantics: the latest bucket value wins,
-- which is correct because each bucket is cumulative for that day (not
-- incremental). Per-request providers (Phase 6) will need a different dedupe
-- key, but for MVP daily buckets this is sufficient.

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_dedupe
  ON usage_records (provider_id, model_id, timestamp);