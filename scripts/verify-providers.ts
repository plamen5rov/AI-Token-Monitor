import { closeDb, getDb } from "@/database"
import { encrypt } from "@/lib/crypto"
import {
  createModel,
  createProvider,
  createSyncLog,
  createUsageRecord,
  getModelsByProviderId,
  getProviders,
  getSyncLogs,
  getUsageRecordsByProvider,
  updateProvider,
  updateSyncLog,
} from "@/lib/db"
import type { Model, NewModel, NormalizedUsageRecord, Provider } from "@/types"
import { BaseProvider } from "@/providers/base"

const TEST_DB = "/tmp/atm-providers-test.sqlite"

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
  console.log(`✓ ${message}`)
}

class MockProvider extends BaseProvider {
  async fetchModels(): Promise<NewModel[]> {
    return [
      {
        provider_id: this.id,
        name: "gpt-4o",
        display_name: "gpt-4o",
        input_price_per_1k: 2.5,
        output_price_per_1k: 10,
        context_window: 128000,
        is_active: 1,
      },
      {
        provider_id: this.id,
        name: "gpt-4o-mini",
        display_name: "gpt-4o-mini",
        input_price_per_1k: 0.15,
        output_price_per_1k: 0.6,
        context_window: 128000,
        is_active: 1,
      },
    ]
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    const ts = Date.now() - 86400000
    return [
      {
        providerId: this.id,
        modelId: "gpt-4o",
        timestamp: ts,
        inputTokens: 12000,
        outputTokens: 3000,
        costUSD: 0,
      },
      {
        providerId: this.id,
        modelId: "gpt-4o-mini",
        timestamp: ts,
        inputTokens: 50000,
        outputTokens: 8000,
        costUSD: 0,
      },
    ]
  }
}

async function runSyncForMock(provider: Provider) {
  const adapter = new MockProvider(provider)
  const startedAt = Date.now()
  const log = createSyncLog({
    provider_id: provider.id,
    status: "partial",
    started_at: startedAt,
    finished_at: null,
    error_message: null,
  })

  try {
    const models = await adapter.fetchModels()
    for (const m of models) createModel(m)
    const usage = await adapter.fetchUsage()

    let saved = 0
    for (const record of usage) {
      const model = getModelsByProviderId(provider.id).find(
        (m) => m.name === record.modelId
      )
      if (!model) continue
      const cost = computeCost(record, model)
      createUsageRecord({
        provider_id: provider.id,
        model_id: model.id,
        timestamp: record.timestamp,
        input_tokens: record.inputTokens,
        output_tokens: record.outputTokens,
        cost_usd: cost,
        request_count: 1,
        raw_payload: null,
      })
      saved++
    }

    updateProvider(provider.id, { last_sync: Date.now() })
    updateSyncLog(log.id, { status: "success", finished_at: Date.now(), error_message: null })

    return { status: "success" as const, modelsSynced: models.length, recordsSynced: saved }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    updateSyncLog(log.id, { status: "error", finished_at: Date.now(), error_message: msg })
    return { status: "error" as const, modelsSynced: 0, recordsSynced: 0 }
  }
}

function computeCost(record: NormalizedUsageRecord, model: Model): number {
  return (
    (record.inputTokens / 1000) * model.input_price_per_1k +
    (record.outputTokens / 1000) * model.output_price_per_1k
  )
}

async function main() {
  process.env.DATABASE_PATH = TEST_DB
  console.log("== Phase 3 Provider Verification ==\n")

  const db = getDb()
  assert(!!db, "database connection initialized")

  try {
    db.exec("DELETE FROM usage_records")
    db.exec("DELETE FROM sync_log")
    db.exec("DELETE FROM models")
    db.exec("DELETE FROM providers")
  } catch {
    // first run, nothing to clean
  }

  const provider = createProvider({
    name: "Mock OpenAI",
    type: "openai",
    api_key_encrypted: encrypt("sk-mock-test-key"),
    is_active: 1,
    created_at: Date.now(),
    last_sync: null,
  })
  console.log(`Created provider: ${provider.name} (${provider.id})`)

  const providers = getProviders()
  assert(providers.length === 1, `expected 1 provider, got ${providers.length}`)

  const result = await runSyncForMock(provider)
  console.log(`Sync result: ${JSON.stringify(result)}`)
  assert(result.status === "success", "sync status should be success")
  assert(result.modelsSynced === 2, `expected 2 models synced, got ${result.modelsSynced}`)
  assert(result.recordsSynced === 2, `expected 2 records synced, got ${result.recordsSynced}`)

  const models = getModelsByProviderId(provider.id)
  assert(models.length === 2, `expected 2 models in DB, got ${models.length}`)
  console.log("Models:")
  for (const m of models) {
    console.log(`  - ${m.name}: in=$${m.input_price_per_1k}/1k out=$${m.output_price_per_1k}/1k`)
  }

  const usage = getUsageRecordsByProvider(provider.id)
  assert(usage.length === 2, `expected 2 usage records, got ${usage.length}`)
  console.log("Usage records:")
  let totalCost = 0
  for (const u of usage) {
    const total = u.input_tokens + u.output_tokens
    console.log(
      `  - model=${u.model_id} in=${u.input_tokens} out=${u.output_tokens} total=${total} cost=$${u.cost_usd.toFixed(4)}`
    )
    assert(u.cost_usd > 0, `expected positive cost for model ${u.model_id}, got ${u.cost_usd}`)
    totalCost += u.cost_usd
  }

  const expectedGpt4o = (12000 / 1000) * 2.5 + (3000 / 1000) * 10
  const expectedMini = (50000 / 1000) * 0.15 + (8000 / 1000) * 0.6
  const expectedTotal = expectedGpt4o + expectedMini
  assert(
    Math.abs(totalCost - expectedTotal) < 0.0001,
    `total cost mismatch: expected ${expectedTotal}, got ${totalCost}`
  )
  console.log(`Total cost: $${totalCost.toFixed(4)} (expected $${expectedTotal.toFixed(4)})`)

  const logs = getSyncLogs(provider.id)
  assert(logs.length === 1, `expected 1 sync log, got ${logs.length}`)
  assert(logs[0].status === "success", `expected sync log status success, got ${logs[0].status}`)
  console.log(`Sync log: status=${logs[0].status} started=${logs[0].started_at} finished=${logs[0].finished_at}`)

  const refreshed = getProviders()[0]
  assert(refreshed.last_sync !== null, "provider last_sync should be set after sync")

  console.log("\nAll Phase 3 assertions passed.")
  console.log("== Phase 3 Verification Complete ==\n")
  closeDb()
}

main().catch((err) => {
  console.error("Verification FAILED:", err)
  process.exit(1)
})