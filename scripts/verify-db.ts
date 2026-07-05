import { closeDb, getDb } from "@/database"
import {
  createModel,
  createProvider,
  createUsageRecord,
  deleteUsageRecord,
  getModels,
  getProviders,
  getUsageRecords,
  updateProvider,
} from "@/lib/db"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
  console.log(`✓ ${message}`)
}

async function main() {
  console.log("Verifying database layer...\n")

  const db = getDb()
  assert(!!db, "database connection initialized")

  // Providers
  const provider = createProvider({
    name: "OpenAI",
    type: "openai",
    api_key_encrypted: "encrypted-key",
    is_active: 1,
    created_at: null,
    last_sync: null,
  })
  assert(provider.id.length > 0, "provider created with UUID")

  const providers = getProviders()
  assert(providers.length === 1, "providers returned from database")

  const updated = updateProvider(provider.id, { name: "OpenAI Updated" })
  assert(updated?.name === "OpenAI Updated", "provider updated")

  // Models
  const model = createModel({
    provider_id: provider.id,
    name: "gpt-4o",
    display_name: "GPT-4o",
    input_price_per_1k: 2.5,
    output_price_per_1k: 10,
    context_window: 128000,
    is_active: 1,
  })
  assert(model.id.length > 0, "model created with UUID")

  const models = getModels()
  assert(models.length === 1, "models returned from database")

  // Usage records
  const record = createUsageRecord({
    provider_id: provider.id,
    model_id: model.id,
    timestamp: Date.now(),
    input_tokens: 100,
    output_tokens: 200,
    cost_usd: 0.00225,
    request_count: 1,
    raw_payload: null,
  })
  assert(record.id.length > 0, "usage record created with UUID")
  assert(record.total_tokens === 300, "total_tokens generated as 300")

  const records = getUsageRecords()
  assert(records.length === 1, "usage records returned from database")

  deleteUsageRecord(record.id)
  assert(getUsageRecords().length === 0, "usage record deleted")

  console.log("\nDatabase layer verified successfully.")
  closeDb()
}

main().catch((error) => {
  console.error(error)
  closeDb()
  process.exit(1)
})
