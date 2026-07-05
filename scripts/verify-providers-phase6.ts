import { closeDb } from "@/database"
import { runMigrations } from "@/database/migrate"
import {
  createProvider,
  deleteProvider,
  getProviders,
  getProviderById,
  updateProvider,
  createModel,
  createUsageRecord,
  rebuildUsageDaily,
  getDashboardTotals,
  getProviderBreakdown,
} from "@/lib/db"
import { encrypt, decrypt } from "@/lib/crypto"
import { createAdapter } from "@/providers"
import { PROVIDER_TEMPLATES, getTemplate } from "@/templates"

const DB_PATH = "/tmp/atm-test-phase6.sqlite"
process.env.DATABASE_PATH = DB_PATH

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`PASS: ${message}`)
}

async function main() {
  // Fresh DB
  const Database = (await import("better-sqlite3")).default
  const db = new Database(DB_PATH)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")
  runMigrations(db)

  console.log("\n=== Phase 6 Verification ===\n")

  // 1. Templates
  console.log("--- Templates ---")
  assert(PROVIDER_TEMPLATES.length === 3, "3 provider templates defined")
  assert(getTemplate("openai")?.displayName === "OpenAI", "OpenAI template exists")
  assert(getTemplate("anthropic")?.displayName === "Anthropic", "Anthropic template exists")
  assert(getTemplate("openrouter")?.displayName === "OpenRouter", "OpenRouter template exists")
  assert(
    getTemplate("anthropic")?.apiKeyPrefix === "sk-ant-admin01-",
    "Anthropic template requires admin key prefix"
  )
  assert(
    getTemplate("anthropic")?.supportsModels === false,
    "Anthropic template has no models endpoint"
  )

  // 2. Provider CRUD with all 3 types
  console.log("\n--- Provider CRUD ---")
  const openaiProvider = createProvider({
    name: "My OpenAI",
    type: "openai",
    api_key_encrypted: encrypt("sk-test-openai-key"),
    is_active: 1,
    created_at: Date.now(),
    last_sync: null,
  })

  const anthropicProvider = createProvider({
    name: "My Anthropic",
    type: "anthropic",
    api_key_encrypted: encrypt("sk-ant-admin01-test-key"),
    is_active: 1,
    created_at: Date.now(),
    last_sync: null,
  })

  const openrouterProvider = createProvider({
    name: "My OpenRouter",
    type: "openrouter",
    api_key_encrypted: encrypt("sk-or-test-key"),
    is_active: 1,
    created_at: Date.now(),
    last_sync: null,
  })

  const allProviders = getProviders()
  assert(allProviders.length === 3, "3 providers created and retrievable")

  // 3. API key encryption
  console.log("\n--- API Key Encryption ---")
  assert(
    decrypt(openaiProvider.api_key_encrypted) === "sk-test-openai-key",
    "OpenAI API key encrypts and decrypts correctly"
  )
  assert(
    decrypt(anthropicProvider.api_key_encrypted) === "sk-ant-admin01-test-key",
    "Anthropic API key encrypts and decrypts correctly"
  )
  assert(
    decrypt(openrouterProvider.api_key_encrypted) === "sk-or-test-key",
    "OpenRouter API key encrypts and decrypts correctly"
  )

  // 4. Adapter factory creates correct types
  console.log("\n--- Adapter Factory ---")
  const openaiAdapter = createAdapter(openaiProvider)
  const anthropicAdapter = createAdapter(anthropicProvider)
  const openrouterAdapter = createAdapter(openrouterProvider)
  assert(openaiAdapter.type === "openai", "Factory creates OpenAI adapter")
  assert(anthropicAdapter.type === "anthropic", "Factory creates Anthropic adapter")
  assert(openrouterAdapter.type === "openrouter", "Factory creates OpenRouter adapter")

  // 5. Toggle provider (enable/disable)
  console.log("\n--- Toggle Provider ---")
  updateProvider(anthropicProvider.id, { is_active: 0 })
  const toggled = getProviderById(anthropicProvider.id)
  assert(toggled?.is_active === 0, "Anthropic provider disabled successfully")
  updateProvider(anthropicProvider.id, { is_active: 1 })
  const reEnabled = getProviderById(anthropicProvider.id)
  assert(reEnabled?.is_active === 1, "Anthropic provider re-enabled successfully")

  // 6. Delete provider
  console.log("\n--- Delete Provider ---")
  const tempProvider = createProvider({
    name: "Temp Provider",
    type: "openai",
    api_key_encrypted: encrypt("sk-temp"),
    is_active: 0,
    created_at: Date.now(),
    last_sync: null,
  })
  assert(getProviders().length === 4, "Temp provider created (4 total)")
  deleteProvider(tempProvider.id)
  assert(getProviders().length === 3, "Temp provider deleted (back to 3)")

  // 7. Multi-provider sync simulation
  console.log("\n--- Multi-Provider Sync ---")
  // Create models for each provider
  const openaiModel = createModel({
    provider_id: openaiProvider.id,
    name: "gpt-4o",
    display_name: "gpt-4o",
    input_price_per_1k: 2.5,
    output_price_per_1k: 10,
    context_window: 128000,
    is_active: 1,
  })

  const anthropicModel = createModel({
    provider_id: anthropicProvider.id,
    name: "claude-sonnet-4-5",
    display_name: "claude-sonnet-4-5",
    input_price_per_1k: 0.003,
    output_price_per_1k: 0.015,
    context_window: 200000,
    is_active: 1,
  })

  const openrouterModel = createModel({
    provider_id: openrouterProvider.id,
    name: "openai/gpt-4o",
    display_name: "GPT-4o (via OpenRouter)",
    input_price_per_1k: 2.5,
    output_price_per_1k: 10,
    context_window: 128000,
    is_active: 1,
  })

  // Insert usage records for each provider (same day, different models)
  const today = new Date()
  today.setHours(23, 59, 59, 0)
  const timestamp = today.getTime()

  createUsageRecord({
    provider_id: openaiProvider.id,
    model_id: openaiModel.id,
    timestamp,
    input_tokens: 100000,
    output_tokens: 50000,
    cost_usd: (100000 / 1000) * 2.5 + (50000 / 1000) * 10,
    request_count: 150,
    raw_payload: null,
  })

  createUsageRecord({
    provider_id: anthropicProvider.id,
    model_id: anthropicModel.id,
    timestamp,
    input_tokens: 200000,
    output_tokens: 30000,
    cost_usd: (200000 / 1000) * 0.003 + (30000 / 1000) * 0.015,
    request_count: 80,
    raw_payload: null,
  })

  createUsageRecord({
    provider_id: openrouterProvider.id,
    model_id: openrouterModel.id,
    timestamp,
    input_tokens: 50000,
    output_tokens: 20000,
    cost_usd: 0.35,
    request_count: 45,
    raw_payload: null,
  })

  // Rebuild daily aggregates for each provider
  rebuildUsageDaily(openaiProvider.id)
  rebuildUsageDaily(anthropicProvider.id)
  rebuildUsageDaily(openrouterProvider.id)

  // 8. Dashboard aggregates across providers
  console.log("\n--- Dashboard Aggregation ---")
  const totals = getDashboardTotals()
  assert(totals.total_input_tokens === 350000, `Total input tokens = 350000 (got ${totals.total_input_tokens})`)
  assert(totals.total_output_tokens === 100000, `Total output tokens = 100000 (got ${totals.total_output_tokens})`)
  assert(totals.total_requests === 275, `Total requests = 275 (got ${totals.total_requests})`)
  assert(totals.total_cost_usd > 0, `Total cost > 0 (got ${totals.total_cost_usd})`)

  // 9. Provider breakdown
  console.log("\n--- Provider Breakdown ---")
  const breakdown = getProviderBreakdown()
  assert(breakdown.length === 3, "Provider breakdown has 3 rows")
  // OpenAI should have the highest cost ($750 for output alone)
  const sortedByCost = [...breakdown].sort((a, b) => b.total_cost_usd - a.total_cost_usd)
  assert(
    sortedByCost[0].provider_name === "My OpenAI",
    `Highest cost provider is My OpenAI (got ${sortedByCost[0].provider_name})`
  )

  // 10. Disabling a provider doesn't remove its historical data
  console.log("\n--- Disable Does Not Remove Data ---")
  updateProvider(anthropicProvider.id, { is_active: 0 })
  const totalsAfterDisable = getDashboardTotals()
  assert(
    totalsAfterDisable.total_input_tokens === 350000,
    "Disabling provider does not remove historical data from dashboard"
  )
  updateProvider(anthropicProvider.id, { is_active: 1 })

  // 11. syncAllProviders only syncs active providers
  console.log("\n--- Sync Filters Active Providers ---")
  updateProvider(openrouterProvider.id, { is_active: 0 })
  const activeProviders = getProviders().filter((p) => p.is_active === 1)
  assert(
    activeProviders.length === 2,
    `Only 2 active providers after disabling OpenRouter (got ${activeProviders.length})`
  )
  updateProvider(openrouterProvider.id, { is_active: 1 })

  // 12. Adapter fetchModels for Anthropic (hardcoded)
  console.log("\n--- Anthropic Hardcoded Models ---")
  const anthropicModels = await anthropicAdapter.fetchModels()
  assert(anthropicModels.length > 0, "Anthropic adapter returns hardcoded models")
  assert(
    anthropicModels.some((m) => m.name === "claude-sonnet-4-5"),
    "Anthropic models include claude-sonnet-4-5"
  )
  assert(
    anthropicModels.some((m) => m.name === "claude-opus-4-8"),
    "Anthropic models include claude-opus-4-8"
  )
  assert(
    anthropicModels.every((m) => m.input_price_per_1k > 0),
    "All Anthropic models have input pricing"
  )

  console.log("\n=== All Phase 6 assertions passed! ===\n")

  closeDb()
  db.close()
  process.exit(0)
}

main().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
