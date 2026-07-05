import { getDb } from "@/database"
import type {
  Model,
  NewModel,
  NewProvider,
  NewUsageRecord,
  Provider,
  Setting,
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
  db.prepare(
    `INSERT INTO usage_records
       (id, provider_id, model_id, timestamp, input_tokens, output_tokens, cost_usd, request_count, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
  return db.prepare("SELECT * FROM usage_records WHERE id = ?").get(id) as UsageRecord
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
