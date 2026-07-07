import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { BaseProvider } from "./base"
import type { NewModel, NormalizedUsageRecord, Provider } from "@/types"

type OpenCodeSessionRow = {
  id: string
  model: string // JSON-encoded: {"id":"...","providerID":"...","variant":"..."}
  cost: number
  tokens_input: number
  tokens_output: number
  tokens_reasoning: number
  tokens_cache_read: number
  tokens_cache_write: number
  time_created: number
  time_updated: number
}

type ParsedModel = {
  id: string
  providerID: string
  variant?: string
}

const OPENCODE_DB_PATHS = [
  path.join(process.env.HOME ?? "~", ".local/share/opencode/opencode.db"),
  path.join(process.env.HOME ?? "~", ".opencode/opencode.db"),
]

function findOpenCodeDb(): string | null {
  for (const p of OPENCODE_DB_PATHS) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function parseModel(raw: string): ParsedModel | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.id && parsed.providerID) return parsed
    // Fallback: raw string is just the model ID
    return { id: raw, providerID: "unknown" }
  } catch {
    return { id: raw, providerID: "unknown" }
  }
}

/**
 * Reads usage data directly from the local OpenCode SQLite database.
 *
 * No API key required — this reads the local file at
 * ~/.local/share/opencode/opencode.db (or ~/.opencode/opencode.db).
 *
 * Each OpenCode session becomes one usage record in ATM, grouped by
 * (model, day). Multiple sessions on the same day with the same model
 * are merged into a single row.
 */
export class OpenCodeLocalProvider extends BaseProvider {
  constructor(provider: Provider) {
    // Bypass BaseProvider's decrypt — opencode-local reads a local DB, no API key
    super({ ...provider, api_key_encrypted: "" })
    // Override the decrypted key since we don't need it
    this.apiKey = ""
  }

  async fetchModels(): Promise<NewModel[]> {
    const dbPath = findOpenCodeDb()
    if (!dbPath) {
      throw new Error(
        "OpenCode database not found. Searched: " + OPENCODE_DB_PATHS.join(", ")
      )
    }

    const db = new Database(dbPath, { readonly: true })
    try {
      // Get distinct models from sessions
      const rows = db
        .prepare(
          `SELECT DISTINCT model FROM session WHERE model IS NOT NULL AND model != ''`
        )
        .all() as { model: string }[]

      const models: NewModel[] = []
      for (const row of rows) {
        const parsed = parseModel(row.model)
        const modelId = parsed?.id || "unknown"
        const providerID = parsed?.providerID || "unknown"
        models.push({
          provider_id: this.id,
          name: modelId,
          display_name: `${modelId} (${providerID})`,
          input_price_per_1k: 0,
          output_price_per_1k: 0,
          context_window: 0,
          is_active: 1,
        })
      }
      return models
    } finally {
      db.close()
    }
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    const dbPath = findOpenCodeDb()
    if (!dbPath) {
      this.lastSyncNotes.push(
        "OpenCode database not found. No usage data imported."
      )
      return []
    }

    const db = new Database(dbPath, { readonly: true })
    try {
      const rows = db
        .prepare(
          `SELECT model, cost, tokens_input, tokens_output, tokens_reasoning,
                  tokens_cache_read, tokens_cache_write, time_created
           FROM session
           WHERE cost > 0 OR tokens_input > 0 OR tokens_output > 0
           ORDER BY time_created ASC`
        )
        .all() as OpenCodeSessionRow[]

      if (rows.length === 0) {
        this.lastSyncNotes.push("No OpenCode sessions with usage found.")
        return []
      }

      // Group by (model_id, day) to merge same-day sessions
      const grouped = new Map<string, NormalizedUsageRecord>()

      for (const row of rows) {
        const parsed = parseModel(row.model)
        const modelId = parsed?.id || "unknown"

        const date = new Date(row.time_created)
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const timestamp = dayStart.getTime()

        const key = `${modelId}:${timestamp}`
        const existing = grouped.get(key)

        if (existing) {
          existing.inputTokens += row.tokens_input
          existing.outputTokens += row.tokens_output
          existing.costUSD += row.cost
          existing.requestCount = (existing.requestCount ?? 0) + 1
        } else {
          grouped.set(key, {
            providerId: this.id,
            modelId,
            timestamp,
            inputTokens: row.tokens_input,
            outputTokens: row.tokens_output,
            costUSD: row.cost,
            requestCount: 1,
          })
        }
      }

      return Array.from(grouped.values())
    } finally {
      db.close()
    }
  }

  async healthCheck(): Promise<boolean> {
    return findOpenCodeDb() !== null
  }
}
