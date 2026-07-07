import { getDb } from "@/database"
import type {
  Budget,
  Model,
  NewBudget,
  NewModel,
  NewProvider,
  NewRequestLog,
  NewSyncLog,
  NewUsageRecord,
  NewVirtualKey,
  Provider,
  RequestLog,
  Setting,
  SyncLog,
  UsageRecord,
  VirtualKey,
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
  const result = db.transaction(() => {
    db.prepare("DELETE FROM usage_records WHERE provider_id = ?").run(id)
    db.prepare("DELETE FROM usage_daily WHERE provider_id = ?").run(id)
    db.prepare("DELETE FROM models WHERE provider_id = ?").run(id)
    db.prepare("DELETE FROM sync_log WHERE provider_id = ?").run(id)
    return db.prepare("DELETE FROM providers WHERE id = ?").run(id)
  })()
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

// --- Dashboard-specific aggregates (Phase 5) ---

export type DailySeriesPoint = {
  date: string
  cost_usd: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  requests: number
}

export function getDailySeries(opts?: {
  providerId?: string
  startDate?: string
  endDate?: string
  limit?: number
}): DailySeriesPoint[] {
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
      `SELECT
         date,
         COALESCE(SUM(total_cost_usd), 0) AS cost_usd,
         COALESCE(SUM(total_input_tokens), 0) AS input_tokens,
         COALESCE(SUM(total_output_tokens), 0) AS output_tokens,
         COALESCE(SUM(total_input_tokens), 0) + COALESCE(SUM(total_output_tokens), 0) AS total_tokens,
         COALESCE(SUM(total_requests), 0) AS requests
       FROM usage_daily
       ${where}
       GROUP BY date
       ORDER BY date ASC
       LIMIT ?`
    )
    .all(...params, limit) as DailySeriesPoint[]
}

export type MonthlySeriesPoint = {
  month: string
  cost_usd: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  requests: number
}

export function getMonthlySeries(opts?: {
  providerId?: string
  limit?: number
}): MonthlySeriesPoint[] {
  const db = getDb()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (opts?.providerId) {
    conditions.push("provider_id = ?")
    params.push(opts.providerId)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = opts?.limit ?? 12

  return db
    .prepare(
      `SELECT
         strftime('%Y-%m', date) AS month,
         COALESCE(SUM(total_cost_usd), 0) AS cost_usd,
         COALESCE(SUM(total_input_tokens), 0) AS input_tokens,
         COALESCE(SUM(total_output_tokens), 0) AS output_tokens,
         COALESCE(SUM(total_input_tokens), 0) + COALESCE(SUM(total_output_tokens), 0) AS total_tokens,
         COALESCE(SUM(total_requests), 0) AS requests
       FROM usage_daily
       ${where}
       GROUP BY month
       ORDER BY month ASC
       LIMIT ?`
    )
    .all(...params, limit) as MonthlySeriesPoint[]
}

export type ProviderBreakdownRow = {
  provider_id: string
  provider_name: string
  total_cost_usd: number
  total_input_tokens: number
  total_output_tokens: number
  total_requests: number
  last_sync: number | null
}

export function getProviderBreakdown(): ProviderBreakdownRow[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT
         p.id AS provider_id,
         p.name AS provider_name,
         COALESCE(SUM(d.total_cost_usd), 0) AS total_cost_usd,
         COALESCE(SUM(d.total_input_tokens), 0) AS total_input_tokens,
         COALESCE(SUM(d.total_output_tokens), 0) AS total_output_tokens,
         COALESCE(SUM(d.total_requests), 0) AS total_requests,
         p.last_sync AS last_sync
       FROM providers p
       LEFT JOIN usage_daily d ON d.provider_id = p.id
       GROUP BY p.id
       ORDER BY total_cost_usd DESC`
    )
    .all() as ProviderBreakdownRow[]
}

export type ModelBreakdownRow = {
  model_id: string
  model_name: string
  provider_name: string
  total_cost_usd: number
  total_input_tokens: number
  total_output_tokens: number
  total_requests: number
}

export function getModelBreakdown(limit = 20): ModelBreakdownRow[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT
         m.id AS model_id,
         COALESCE(m.display_name, m.name) AS model_name,
         p.name AS provider_name,
         COALESCE(SUM(d.total_cost_usd), 0) AS total_cost_usd,
         COALESCE(SUM(d.total_input_tokens), 0) AS total_input_tokens,
         COALESCE(SUM(d.total_output_tokens), 0) AS total_output_tokens,
         COALESCE(SUM(d.total_requests), 0) AS total_requests
       FROM models m
       LEFT JOIN usage_daily d ON d.model_id = m.id
       LEFT JOIN providers p ON p.id = m.provider_id
       GROUP BY m.id
       ORDER BY total_cost_usd DESC
       LIMIT ?`
    )
    .all(limit) as ModelBreakdownRow[]
}

export type RecentActivityRow = {
  id: string
  provider_name: string
  model_name: string | null
  timestamp: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  request_count: number
}

export function getRecentActivity(limit = 15): RecentActivityRow[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT
         u.id,
         p.name AS provider_name,
         COALESCE(m.display_name, m.name) AS model_name,
         u.timestamp,
         u.input_tokens,
         u.output_tokens,
         u.total_tokens,
         u.cost_usd,
         u.request_count
       FROM usage_records u
       LEFT JOIN providers p ON p.id = u.provider_id
       LEFT JOIN models m ON m.id = u.model_id
       ORDER BY u.timestamp DESC
       LIMIT ?`
    )
    .all(limit) as RecentActivityRow[]
}

export function getActiveProvidersCount(): number {
  const db = getDb()
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM providers WHERE is_active = 1")
    .get() as { n: number }
  return row.n
}

export function getRequestsTodayCount(): number {
  const db = getDb()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(total_requests), 0) AS n FROM usage_daily WHERE date = ?"
    )
    .get(todayStr) as { n: number }
  return row.n
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

// --- Request logs (gateway) ---

export function createRequestLog(log: NewRequestLog): RequestLog {
  const db = getDb()
  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO request_logs (id, provider, model, endpoint, method, status, input_tokens, output_tokens, cost_usd, latency_ms, virtual_key_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    log.provider,
    log.model ?? null,
    log.endpoint,
    log.method,
    log.status ?? null,
    log.input_tokens,
    log.output_tokens,
    log.cost_usd,
    log.latency_ms,
    log.virtual_key_id ?? null,
    log.created_at
  )
  return db.prepare("SELECT * FROM request_logs WHERE id = ?").get(id) as RequestLog
}

export function getRequestLogs(opts?: {
  provider?: string
  model?: string
  limit?: number
  offset?: number
}): RequestLog[] {
  const db = getDb()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (opts?.provider) {
    conditions.push("provider = ?")
    params.push(opts.provider)
  }
  if (opts?.model) {
    conditions.push("model = ?")
    params.push(opts.model)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = opts?.limit ?? 100
  const offset = opts?.offset ?? 0

  return db
    .prepare(
      `SELECT * FROM request_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as RequestLog[]
}

export function getRequestLogStats(provider?: string): {
  total_requests: number
  total_cost_usd: number
  total_input_tokens: number
  total_output_tokens: number
  avg_latency_ms: number
} {
  const db = getDb()
  const where = provider ? "WHERE provider = ?" : ""
  const params = provider ? [provider] : []
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total_requests,
         COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
         COALESCE(SUM(input_tokens), 0) AS total_input_tokens,
         COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
         COALESCE(AVG(latency_ms), 0) AS avg_latency_ms
       FROM request_logs ${where}`
    )
    .get(...params) as {
    total_requests: number
    total_cost_usd: number
    total_input_tokens: number
    total_output_tokens: number
    avg_latency_ms: number
  }
  return row
}

// --- Virtual keys (gateway auth) ---

export function createVirtualKey(vk: NewVirtualKey): VirtualKey {
  const db = getDb()
  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO virtual_keys (id, name, key_hash, provider, is_active, budget_usd, budget_used_usd, created_at, last_used_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    vk.name,
    vk.key_hash,
    vk.provider,
    vk.is_active,
    vk.budget_usd ?? null,
    vk.budget_used_usd,
    vk.created_at,
    vk.last_used_at ?? null
  )
  return db.prepare("SELECT * FROM virtual_keys WHERE id = ?").get(id) as VirtualKey
}

export function getVirtualKeys(): VirtualKey[] {
  const db = getDb()
  return db.prepare("SELECT * FROM virtual_keys ORDER BY created_at DESC").all() as VirtualKey[]
}

export function getVirtualKeyByHash(hash: string): VirtualKey | undefined {
  const db = getDb()
  return db
    .prepare("SELECT * FROM virtual_keys WHERE key_hash = ? AND is_active = 1")
    .get(hash) as VirtualKey | undefined
}

export function updateVirtualKey(id: string, updates: Partial<NewVirtualKey>): VirtualKey | undefined {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM virtual_keys WHERE id = ?").get(id) as VirtualKey | undefined
  if (!existing) return undefined

  const next = { ...existing, ...updates }
  db.prepare(
    `UPDATE virtual_keys SET name = ?, provider = ?, is_active = ?, budget_usd = ?, budget_used_usd = ?, last_used_at = ? WHERE id = ?`
  ).run(next.name, next.provider, next.is_active, next.budget_usd, next.budget_used_usd, next.last_used_at, id)
  return next
}

export function deleteVirtualKey(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM virtual_keys WHERE id = ?").run(id)
  return result.changes > 0
}

// --- Budgets ---

export function createBudget(budget: NewBudget): Budget {
  const db = getDb()
  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO budgets (id, scope, scope_id, limit_usd, period, used_usd, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, budget.scope, budget.scope_id ?? null, budget.limit_usd, budget.period, budget.used_usd, budget.created_at)
  return db.prepare("SELECT * FROM budgets WHERE id = ?").get(id) as Budget
}

export function getBudgets(): Budget[] {
  const db = getDb()
  return db.prepare("SELECT * FROM budgets ORDER BY created_at DESC").all() as Budget[]
}

export function getActiveBudgets(): Budget[] {
  const db = getDb()
  return db.prepare("SELECT * FROM budgets WHERE used_usd < limit_usd").all() as Budget[]
}

export function updateBudget(id: string, updates: Partial<NewBudget>): Budget | undefined {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM budgets WHERE id = ?").get(id) as Budget | undefined
  if (!existing) return undefined

  const next = { ...existing, ...updates }
  db.prepare(
    `UPDATE budgets SET scope = ?, scope_id = ?, limit_usd = ?, period = ?, used_usd = ? WHERE id = ?`
  ).run(next.scope, next.scope_id, next.limit_usd, next.period, next.used_usd, id)
  return next
}

export function deleteBudget(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM budgets WHERE id = ?").run(id)
  return result.changes > 0
}

export function incrementBudgetUsage(id: string, amount: number): void {
  const db = getDb()
  db.prepare("UPDATE budgets SET used_usd = used_usd + ? WHERE id = ?").run(amount, id)
}

export function checkBudgetAllowed(provider: string, model: string | null): boolean {
  const db = getDb()
  // Check provider-level budget
  const providerBudget = db
    .prepare("SELECT * FROM budgets WHERE scope = 'provider' AND scope_id = ? AND used_usd < limit_usd")
    .get(provider) as Budget | undefined
  if (providerBudget) return true

  // Check global budget
  const globalBudget = db
    .prepare("SELECT * FROM budgets WHERE scope = 'global' AND scope_id IS NULL AND used_usd < limit_usd")
    .get() as Budget | undefined
  if (globalBudget) return true

  // Check model-level budget
  if (model) {
    const modelBudget = db
      .prepare("SELECT * FROM budgets WHERE scope = 'model' AND scope_id = ? AND used_usd < limit_usd")
      .get(model) as Budget | undefined
    if (modelBudget) return true
  }

  // No budget = no limit (allow)
  return true
}

// --- Dashboard gateway stats ---

export type GatewayDailyPoint = {
  date: string
  requests: number
  cost_usd: number
  avg_latency_ms: number
}

export function getGatewayDailySeries(opts?: { limit?: number }): GatewayDailyPoint[] {
  const db = getDb()
  const limit = opts?.limit ?? 30
  return db
    .prepare(
      `SELECT
         date(created_at / 1000, 'unixepoch') AS date,
         COUNT(*) AS requests,
         COALESCE(SUM(cost_usd), 0) AS cost_usd,
         COALESCE(AVG(latency_ms), 0) AS avg_latency_ms
       FROM request_logs
       GROUP BY date
       ORDER BY date DESC
       LIMIT ?`
    )
    .all(limit) as GatewayDailyPoint[]
}
