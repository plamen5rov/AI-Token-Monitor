import { getDb } from "@/database"
import type {
  Model,
  NewModel,
  NewProvider,
  NewSyncLog,
  NewUsageRecord,
  Provider,
  Setting,
  SyncLog,
  UsageRecord,
} from "@/types"

function now() {
  return Date.now()
}

// Providers

export function createProvider(provider: NewProvider): Provider {
  const db = getDb()
  const id = crypto.randomUUID()
  const created_at = provider.created_at ?? now()
  db.prepare(
    `INSERT INTO providers (id, name, type, api_key_encrypted, is_active, created_at, last_sync)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    provider.name,
    provider.type,
    provider.api_key_encrypted,
    provider.is_active,
    created_at,
    provider.last_sync
  )
  return { ...provider, id, created_at }
}

export function getProviders(): Provider[] {
  const db = getDb()
  return db.prepare("SELECT * FROM providers ORDER BY created_at DESC").all() as Provider[]
}

export function getProviderById(id: string): Provider | undefined {
  const db = getDb()
  return db.prepare("SELECT * FROM providers WHERE id = ?").get(id) as Provider | undefined
}

export function updateProvider(
  id: string,
  updates: Partial<NewProvider>
): Provider | undefined {
  const db = getDb()
  const existing = getProviderById(id)
  if (!existing) return undefined

  const next = { ...existing, ...updates }
  db.prepare(
    `UPDATE providers
     SET name = ?, type = ?, api_key_encrypted = ?, is_active = ?, last_sync = ?
     WHERE id = ?`
  ).run(
    next.name,
    next.type,
    next.api_key_encrypted,
    next.is_active,
    next.last_sync,
    id
  )
  return next
}

export function deleteProvider(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM providers WHERE id = ?").run(id)
  return result.changes > 0
}

// Models

export function createModel(model: NewModel): Model {
  const db = getDb()
  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO models (id, provider_id, name, display_name, input_price_per_1k, output_price_per_1k, context_window, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    model.provider_id,
    model.name,
    model.display_name ?? null,
    model.input_price_per_1k,
    model.output_price_per_1k,
    model.context_window,
    model.is_active
  )
  return { ...model, id }
}

export function getModels(): Model[] {
  const db = getDb()
  return db.prepare("SELECT * FROM models ORDER BY name").all() as Model[]
}

export function getModelsByProviderId(providerId: string): Model[] {
  const db = getDb()
  return db
    .prepare("SELECT * FROM models WHERE provider_id = ? ORDER BY name")
    .all(providerId) as Model[]
}

export function getModelByName(
  providerId: string,
  name: string
): Model | undefined {
  const db = getDb()
  return db
    .prepare("SELECT * FROM models WHERE provider_id = ? AND name = ?")
    .get(providerId, name) as Model | undefined
}

export function updateModel(id: string, updates: Partial<NewModel>): Model | undefined {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM models WHERE id = ?").get(id) as Model | undefined
  if (!existing) return undefined

  const next = { ...existing, ...updates }
  db.prepare(
    `UPDATE models
     SET provider_id = ?, name = ?, display_name = ?, input_price_per_1k = ?,
         output_price_per_1k = ?, context_window = ?, is_active = ?
     WHERE id = ?`
  ).run(
    next.provider_id,
    next.name,
    next.display_name,
    next.input_price_per_1k,
    next.output_price_per_1k,
    next.context_window,
    next.is_active,
    id
  )
  return next
}

export function deleteModel(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM models WHERE id = ?").run(id)
  return result.changes > 0
}

// Usage records

export function createUsageRecord(record: NewUsageRecord): UsageRecord {
  const db = getDb()
  const id = crypto.randomUUID()

  // Upsert on (provider_id, model_id, timestamp). Re-syncing the same daily
  // bucket replaces tokens/cost with the latest cumulative value rather than
  // double-counting. See migrations/002_usage_records_dedupe.sql.
  db.prepare(
    `INSERT INTO usage_records
       (id, provider_id, model_id, timestamp, input_tokens, output_tokens, cost_usd, request_count, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider_id, model_id, timestamp) DO UPDATE SET
       input_tokens = excluded.input_tokens,
       output_tokens = excluded.output_tokens,
       cost_usd = excluded.cost_usd,
       request_count = excluded.request_count`
  ).run(
    id,
    record.provider_id,
    record.model_id ?? null,
    record.timestamp,
    record.input_tokens,
    record.output_tokens,
    record.cost_usd,
    record.request_count,
    record.raw_payload ?? null
  )

  return db.prepare(
    "SELECT * FROM usage_records WHERE provider_id = ? AND model_id = ? AND timestamp = ?"
  ).get(record.provider_id, record.model_id, record.timestamp) as UsageRecord
}

// --- usage_daily (pre-aggregated for fast dashboards) ---

export type UsageDailyRow = {
  date: string
  provider_id: string | null
  model_id: string | null
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
  total_requests: number
}

export function rebuildUsageDaily(providerId: string): void {
  const db = getDb()

  db.prepare("DELETE FROM usage_daily WHERE provider_id = ?").run(providerId)

  db.prepare(
    `INSERT INTO usage_daily
       (id, date, provider_id, model_id, total_input_tokens, total_output_tokens, total_cost_usd, total_requests)
     SELECT
       provider_id || ':' || COALESCE(model_id, '') || ':' || date(ROUND(timestamp / 1000.0), 'unixepoch') AS row_id,
       date(ROUND(timestamp / 1000.0), 'unixepoch') AS day,
       provider_id,
       model_id,
       SUM(input_tokens) AS total_input_tokens,
       SUM(output_tokens) AS total_output_tokens,
       SUM(cost_usd) AS total_cost_usd,
       SUM(request_count) AS total_requests
     FROM usage_records
     WHERE provider_id = ?
     GROUP BY day, provider_id, model_id`
  ).run(providerId)
}

export function getUsageDaily(opts?: {
  providerId?: string
  startDate?: string
  endDate?: string
  limit?: number
}): UsageDailyRow[] {
  const db = getDb()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (opts?.providerId) {
    conditions.push("provider_id = ?")
    params.push(opts.providerId)
  }
  if (opts?.startDate) {
    conditions.push("date >= ?")
    params.push(opts.startDate)
  }
  if (opts?.endDate) {
    conditions.push("date <= ?")
    params.push(opts.endDate)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = opts?.limit ?? 365

  return db
    .prepare(
      `SELECT date, provider_id, model_id, total_input_tokens, total_output_tokens, total_cost_usd, total_requests
       FROM usage_daily
       ${where}
       ORDER BY date ASC
       LIMIT ?`
    )
    .all(...params, limit) as UsageDailyRow[]
}

export function getDashboardTotals(): {
  total_cost_usd: number
  total_input_tokens: number
  total_output_tokens: number
  total_requests: number
} {
  const db = getDb()
  return (
    db
      .prepare(
        `SELECT
           COALESCE(SUM(total_cost_usd), 0) AS total_cost_usd,
           COALESCE(SUM(total_input_tokens), 0) AS total_input_tokens,
           COALESCE(SUM(total_output_tokens), 0) AS total_output_tokens,
           COALESCE(SUM(total_requests), 0) AS total_requests
         FROM usage_daily`
      )
      .get() as {
      total_cost_usd: number
      total_input_tokens: number
      total_output_tokens: number
      total_requests: number
    }
  )
}

export function getUsageRecords(limit = 100): UsageRecord[] {
  const db = getDb()
  return db
    .prepare("SELECT * FROM usage_records ORDER BY timestamp DESC LIMIT ?")
    .all(limit) as UsageRecord[]
}

export function getUsageRecordsByProvider(providerId: string, limit = 100): UsageRecord[] {
  const db = getDb()
  return db
    .prepare(
      "SELECT * FROM usage_records WHERE provider_id = ? ORDER BY timestamp DESC LIMIT ?"
    )
    .all(providerId, limit) as UsageRecord[]
}

export function getUsageRecordsByModel(modelId: string, limit = 100): UsageRecord[] {
  const db = getDb()
  return db
    .prepare(
      "SELECT * FROM usage_records WHERE model_id = ? ORDER BY timestamp DESC LIMIT ?"
    )
    .all(modelId, limit) as UsageRecord[]
}

export function deleteUsageRecord(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM usage_records WHERE id = ?").run(id)
  return result.changes > 0
}

// Settings

export function getSetting(key: string): string | undefined {
  const db = getDb()
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | Setting
    | undefined
  return row?.value
}

export function setSetting(key: string, value: string): void {
  const db = getDb()
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value)
}

// Sync log

export function createSyncLog(log: NewSyncLog): SyncLog {
  const db = getDb()
  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO sync_log (id, provider_id, status, started_at, finished_at, error_message)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    log.provider_id,
    log.status,
    log.started_at,
    log.finished_at,
    log.error_message
  )
  return { ...log, id }
}

export function getSyncLogs(providerId?: string, limit = 50): SyncLog[] {
  const db = getDb()
  if (providerId) {
    return db
      .prepare(
        "SELECT * FROM sync_log WHERE provider_id = ? ORDER BY started_at DESC LIMIT ?"
      )
      .all(providerId, limit) as SyncLog[]
  }
  return db
    .prepare("SELECT * FROM sync_log ORDER BY started_at DESC LIMIT ?")
    .all(limit) as SyncLog[]
}

export function updateSyncLog(
  id: string,
  updates: Partial<NewSyncLog>
): SyncLog | undefined {
  const db = getDb()
  const existing = db
    .prepare("SELECT * FROM sync_log WHERE id = ?")
    .get(id) as SyncLog | undefined
  if (!existing) return undefined

  const next = { ...existing, ...updates }
  db.prepare(
    `UPDATE sync_log
     SET status = ?, finished_at = ?, error_message = ?
     WHERE id = ?`
  ).run(next.status, next.finished_at, next.error_message, id)
  return next
}
