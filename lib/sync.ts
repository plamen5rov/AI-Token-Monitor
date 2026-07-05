import { createAdapter } from "@/providers"
import {
  createModel,
  createSyncLog,
  createUsageRecord,
  getModelByName,
  getProviders,
  updateModel,
  updateProvider,
  updateSyncLog,
} from "@/lib/db"
import type { Model, NewSyncLog, NormalizedUsageRecord, Provider } from "@/types"
import type { BaseProvider } from "@/providers/base"

export type SyncResult = {
  providerId: string
  status: "success" | "error" | "partial"
  modelsSynced: number
  recordsSynced: number
  error?: string
}

export async function syncProvider(provider: Provider): Promise<SyncResult> {
  const startedAt = Date.now()
  let logId: string | undefined

  try {
    const adapter = createAdapter(provider)
    logId = startLog(provider.id, startedAt)

    const modelsSynced = await syncModels(adapter, provider.id)
    const recordsSynced = await syncUsage(adapter, provider.id)

    updateProvider(provider.id, { last_sync: Date.now() })
    finishLog(logId, "success")

    return {
      providerId: provider.id,
      status: "success",
      modelsSynced,
      recordsSynced,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (logId) finishLog(logId, "error", message)
    return { providerId: provider.id, status: "error", modelsSynced: 0, recordsSynced: 0, error: message }
  }
}

export async function syncAllProviders(): Promise<SyncResult[]> {
  const providers = getProviders().filter((p) => p.is_active === 1)
  const results: SyncResult[] = []
  for (const provider of providers) {
    results.push(await syncProvider(provider))
  }
  return results
}

async function syncModels(adapter: BaseProvider, providerId: string): Promise<number> {
  const models = await adapter.fetchModels()
  let count = 0

  for (const model of models) {
    const existing = getModelByName(providerId, model.name)
    if (existing) {
      updateModel(existing.id, {
        input_price_per_1k: model.input_price_per_1k,
        output_price_per_1k: model.output_price_per_1k,
        is_active: 1,
      })
    } else {
      createModel(model)
    }
    count++
  }

  return count
}

async function syncUsage(adapter: BaseProvider, providerId: string): Promise<number> {
  const records = await adapter.fetchUsage()
  let count = 0

  for (const record of records) {
    const model = getModelByName(providerId, record.modelId)
    if (!model) continue

    const cost = record.costUSD || computeCost(record, model)
    createUsageRecord({
      provider_id: providerId,
      model_id: model.id,
      timestamp: record.timestamp,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      cost_usd: cost,
      request_count: 1,
      raw_payload: null,
    })
    count++
  }

  return count
}

function computeCost(record: NormalizedUsageRecord, model: Model): number {
  return (
    (record.inputTokens / 1000) * model.input_price_per_1k +
    (record.outputTokens / 1000) * model.output_price_per_1k
  )
}

function startLog(providerId: string, startedAt: number): string {
  const log: NewSyncLog = {
    provider_id: providerId,
    status: "partial",
    started_at: startedAt,
    finished_at: null,
    error_message: null,
  }
  return createSyncLog(log).id
}

function finishLog(
  logId: string,
  status: "success" | "error" | "partial",
  errorMessage?: string
): void {
  updateSyncLog(logId, {
    status,
    finished_at: Date.now(),
    error_message: errorMessage ?? null,
  })
}

export async function healthCheckProvider(provider: Provider): Promise<boolean> {
  try {
    const adapter = createAdapter(provider)
    return await adapter.healthCheck()
  } catch {
    return false
  }
}