import { closeDb, getDb } from "@/database"
import { encrypt } from "@/lib/crypto"
import {
  createModel,
  createProvider,
  createSyncLog,
  createUsageRecord,
  getModelByName,
  getDashboardTotals,
  getProviders,
  getSyncLogs,
  getUsageDaily,
  getUsageRecordsByProvider,
  rebuildUsageDaily,
  updateProvider,
  updateSyncLog,
} from "@/lib/db"
import type { NewModel, NormalizedUsageRecord, Provider } from "@/types"
import { BaseProvider } from "@/providers/base"

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`)
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
    ]
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    const ts = Date.parse("2026-07-01T00:00:00Z")
    return [
      {
        providerId: this.id,
        modelId: "gpt-4o",
        timestamp: ts,
        inputTokens: 12000,
        outputTokens: 3000,
        costUSD: 0,
      },
    ]
  }
}

let adapter: MockProvider

async function mockSync(provider: Provider): Promise<string> {
  const started = Date.now()
  const log = createSyncLog({
    provider_id: provider.id,
    status: "partial",
    started_at: started,
    finished_at: null,
    error_message: null,
  })

  try {
    const models = await adapter.fetchModels()
    for (const m of models) {
      const ex = getModelByName(provider.id, m.name)
      if (!ex) createModel(m)
    }

    const usage = await adapter.fetchUsage()
    for (const r of usage) {
      const model = getModelByName(provider.id, r.modelId)
      if (!model) continue
      const cost =
        (r.inputTokens / 1000) * model.input_price_per_1k +
        (r.outputTokens / 1000) * model.output_price_per_1k
      createUsageRecord({
        provider_id: provider.id,
        model_id: model.id,
        timestamp: r.timestamp,
        input_tokens: r.inputTokens,
        output_tokens: r.outputTokens,
        cost_usd: cost,
        request_count: 1,
        raw_payload: null,
      })
    }

    rebuildUsageDaily(provider.id)
    updateProvider(provider.id, { last_sync: Date.now() })
    updateSyncLog(log.id, { status: "success", finished_at: Date.now(), error_message: null })
    return "success"
  } catch (e) {
    updateSyncLog(log.id, {
      status: "error",
      finished_at: Date.now(),
      error_message: String(e),
    })
    throw e
  }
}

async function main() {
  console.log("== Phase 4 Synchronization Engine Verification ==\n")

  const db = getDb()
  assert(!!db, "database connection initialized")

  try {
    db.exec("DELETE FROM usage_daily")
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
  adapter = new MockProvider(provider)

  // --- Run 1 ---
  await mockSync(provider)
  console.log("Run 1: first sync complete")
  assert(getUsageRecordsByProvider(provider.id).length === 1, "run 1: 1 usage record")
  assert(getUsageDaily().length === 1, "run 1: 1 usage_daily row")
  const totals1 = getDashboardTotals()
  console.log(`  totals1 cost=${totals1.total_cost_usd} in=${totals1.total_input_tokens} out=${totals1.total_output_tokens}`)

  // --- Run 2 (idempotency test) ---
  await mockSync(provider)
  console.log("Run 2: second sync complete (should be idempotent)")
  assert(
    getUsageRecordsByProvider(provider.id).length === 1,
    "run 2: STILL 1 usage record (dedupe worked)"
  )
  assert(getUsageDaily().length === 1, "run 2: STILL 1 usage_daily row")
  const totals2 = getDashboardTotals()
  console.log(`  totals2 cost=${totals2.total_cost_usd} in=${totals2.total_input_tokens} out=${totals2.total_output_tokens}`)

  assert(
    Math.abs(totals1.total_cost_usd - totals2.total_cost_usd) < 0.0001,
    "cost not doubled between run 1 and run 2"
  )
  assert(
    totals1.total_input_tokens === totals2.total_input_tokens,
    "input tokens not doubled between run 1 and run 2"
  )
  assert(getSyncLogs(provider.id).length === 2, "two sync_log entries recorded")
  assert(
    getProviders()[0].last_sync !== null,
    "provider.last_sync updated after sync"
  )

  // --- Updated bucket test: a new sync with a higher token count should REPLACE, not stack ---
  const adapter2 = new (class extends MockProvider {
    async fetchUsage(): Promise<NormalizedUsageRecord[]> {
      return [
        {
          providerId: this.id,
          modelId: "gpt-4o",
          timestamp: Date.parse("2026-07-01T00:00:00Z"),
          inputTokens: 15000, // grew from 12000
          outputTokens: 4000, // grew from 3000
          costUSD: 0,
        },
      ]
    }
  })(provider)
  adapter = adapter2
  await mockSync(provider)
  console.log("Run 3: bucket value grew — should replace, not stack")
  const recs = getUsageRecordsByProvider(provider.id)
  assert(recs.length === 1, "run 3: still single row (replace semantics)")
  assert(recs[0].input_tokens === 15000, `run 3: input_tokens=15000, got ${recs[0].input_tokens}`)
  assert(recs[0].output_tokens === 4000, `run 3: output_tokens=4000, got ${recs[0].output_tokens}`)
  const totals3 = getDashboardTotals()
  const expectedCost = (15000 / 1000) * 2.5 + (4000 / 1000) * 10
  assert(
    Math.abs(totals3.total_cost_usd - expectedCost) < 0.0001,
    `run 3: total cost = ${expectedCost}, got ${totals3.total_cost_usd}`
  )

  console.log("\nAll Phase 4 assertions passed.")
  console.log("== Phase 4 Verification Complete ==\n")
  closeDb()
}

main().catch((err) => {
  console.error("Verification FAILED:", err)
  process.exit(1)
})