import { closeDb, getDb } from "@/database"
import { encrypt } from "@/lib/crypto"
import {
  createModel,
  createProvider,
  createUsageRecord,
  getDailySeries,
  getDashboardTotals,
  getModelBreakdown,
  getMonthlySeries,
  getProviderBreakdown,
  getRecentActivity,
  rebuildUsageDaily,
} from "@/lib/db"

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`✓ ${message}`)
}

function main() {
  console.log("== Phase 5 Dashboard Query Verification ==\n")
  const db = getDb()

  try {
    db.exec("DELETE FROM usage_daily")
    db.exec("DELETE FROM usage_records")
    db.exec("DELETE FROM models")
    db.exec("DELETE FROM providers")
  } catch {
    // first run
  }

  const provider = createProvider({
    name: "OpenAI Test",
    type: "openai",
    api_key_encrypted: encrypt("sk-seed-test-key"),
    is_active: 1,
    created_at: Date.now(),
    last_sync: null,
  })

  const models = [
    {
      name: "gpt-4o",
      display_name: "GPT-4o",
      in: 2.5,
      out: 10,
    },
    {
      name: "gpt-4o-mini",
      display_name: "GPT-4o mini",
      in: 0.15,
      out: 0.6,
    },
    {
      name: "o1-preview",
      display_name: "o1 preview",
      in: 15,
      out: 60,
    },
  ]

  const modelIdByName = new Map<string, string>()
  for (const m of models) {
    const rec = createModel({
      provider_id: provider.id,
      name: m.name,
      display_name: m.display_name,
      input_price_per_1k: m.in,
      output_price_per_1k: m.out,
      context_window: 128000,
      is_active: 1,
    })
    modelIdByName.set(m.name, rec.id)
  }

  // Seed 90 days of daily buckets
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    d.setUTCHours(0, 0, 0, 0)
    const ts = d.getTime()

    for (const m of models) {
      const inTok = Math.floor(1000 + Math.random() * 50000 * (1 + (89 - i) / 100))
      const outTok = Math.floor(inTok * (0.3 + Math.random() * 0.4))
      const cost = (inTok / 1000) * m.in + (outTok / 1000) * m.out
      createUsageRecord({
        provider_id: provider.id,
        model_id: modelIdByName.get(m.name) ?? null,
        timestamp: ts,
        input_tokens: inTok,
        output_tokens: outTok,
        cost_usd: cost,
        request_count: Math.floor(1 + Math.random() * 50),
        raw_payload: null,
      })
    }
  }

  rebuildUsageDaily(provider.id)

  console.log("\n--- getDashboardTotals ---")
  const totals = getDashboardTotals()
  console.log(JSON.stringify(totals, null, 2))
  assert(totals.total_cost_usd > 0, "totals: cost > 0")
  assert(totals.total_input_tokens > 0, "totals: input > 0")
  assert(totals.total_output_tokens > 0, "totals: output > 0")
  assert(totals.total_requests > 0, "totals: requests > 0")

  console.log("\n--- getDailySeries (last 90 days) ---")
  const daily = getDailySeries({ limit: 90 })
  console.log(`  ${daily.length} daily points`)
  console.log(`  first: ${JSON.stringify(daily[0])}`)
  console.log(`  last:  ${JSON.stringify(daily[daily.length - 1])}`)
  assert(daily.length === 90, `daily: 90 points (got ${daily.length})`)
  assert(daily.every((p) => p.cost_usd >= 0), "daily: all cost >= 0")

  console.log("\n--- getMonthlySeries ---")
  const monthly = getMonthlySeries({ limit: 12 })
  console.log(`  ${monthly.length} monthly points`)
  for (const m of monthly) console.log(`  ${JSON.stringify(m)}`)
  assert(monthly.length >= 1, "monthly: at least 1 point")

  console.log("\n--- getProviderBreakdown ---")
  const providers = getProviderBreakdown()
  for (const p of providers) console.log(`  ${JSON.stringify(p)}`)
  assert(providers.length === 1, "provider breakdown: 1 provider")
  assert(providers[0].total_cost_usd > 0, "provider breakdown: cost > 0")

  console.log("\n--- getModelBreakdown ---")
  const models2 = getModelBreakdown(10)
  for (const m of models2) console.log(`  ${JSON.stringify(m)}`)
  assert(models2.length === 3, `model breakdown: 3 models (got ${models2.length})`)
  // GPT-4o (most expensive per token) should not necessarily be highest cost;
  // o1-preview has highest pricing so it should usually be top
  assert(models2[0].total_cost_usd > 0, "model breakdown: top model cost > 0")

  console.log("\n--- getRecentActivity ---")
  const recent = getRecentActivity(15)
  console.log(`  ${recent.length} recent rows`)
  console.log(`  first: ${JSON.stringify(recent[0])}`)
  assert(recent.length > 0, "recent activity: at least 1 row")
  // Should be ordered by timestamp DESC (most recent first)
  assert(
    recent[0].timestamp >= recent[recent.length - 1].timestamp,
    "recent activity: ordered DESC"
  )

  console.log("\nAll Phase 5 assertions passed.")
  console.log("== Phase 5 Verification Complete ==\n")
  closeDb()
}

main()
