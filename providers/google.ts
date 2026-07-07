import { BaseProvider } from "./base"
import type { NewModel, NormalizedUsageRecord } from "@/types"

const GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

type GoogleModel = {
  name: string
  displayName?: string
  description?: string
  inputTokenLimit?: number
  outputTokenLimit?: number
  supportedGenerationMethods?: string[]
}

type GoogleModelsResponse = {
  models?: GoogleModel[]
}

export class GoogleProvider extends BaseProvider {
  async fetchModels(): Promise<NewModel[]> {
    const res = await fetch(`${GOOGLE_BASE_URL}/models`, {
      headers: { "x-goog-api-key": this.apiKey },
    })

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Google AI Studio models request failed: " +
            `${res.status} ${res.statusText}. Verify your Gemini API key at ` +
            "https://aistudio.google.com/apikey — keys typically start with 'AIza'."
        )
      }
      throw new Error(
        `Google AI Studio models request failed: ${res.status} ${res.statusText}`
      )
    }

    const data = (await res.json()) as GoogleModelsResponse
    const models = data.models ?? []

    return models
      .filter((m) => {
        // Only include generative text models — skip embedding-only, image-only, etc.
        const methods = m.supportedGenerationMethods ?? []
        return methods.includes("generateContent")
      })
      .map((m) => {
        const name = m.name.replace(/^models\//, "")
        const context =
          (m.inputTokenLimit ?? 0) + (m.outputTokenLimit ?? 0)
        return {
          provider_id: this.id,
          name,
          display_name: m.displayName || name,
          // Google's /models endpoint does not expose per-token pricing.
          // Usage costs are surfaced via aistudio.google.com/usage only.
          input_price_per_1k: 0,
          output_price_per_1k: 0,
          context_window: context,
          is_active: 1,
        }
      })
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    // Google AI Studio / Gemini API has no public REST endpoint for aggregated
    // token usage history. Each generateContent response includes per-request
    // usage, but there is no /organization/usage analog to OpenAI's admin API.
    // Usage analytics are surfaced in the AI Studio dashboard at
    // https://aistudio.google.com/usage and via Google Cloud Monitoring / BigQuery
    // (requires GCP authentication, not the Gemini API key).
    // Returning an empty array keeps the sync pipeline working as a no-op for
    // this provider type while still keeping the model registry up to date.
    this.lastSyncNotes.push(
      "Google AI Studio has no public usage API. View usage at https://aistudio.google.com/usage. To track usage automatically, route requests through the ATM gateway."
    )
    return []
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${GOOGLE_BASE_URL}/models`, {
        headers: { "x-goog-api-key": this.apiKey },
      })
      return res.ok
    } catch {
      return false
    }
  }
}