import { BaseProvider } from "./base"
import type { NewModel, NormalizedUsageRecord } from "@/types"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

type OpenRouterModel = {
  id: string
  name: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
}

type OpenRouterModelsResponse = {
  data: OpenRouterModel[]
}

type OpenRouterActivityItem = {
  date: string
  model: string
  model_permaslug: string
  prompt_tokens: number
  completion_tokens: number
  reasoning_tokens: number
  requests: number
  usage: number
}

type OpenRouterActivityResponse = {
  data: OpenRouterActivityItem[]
}

export class OpenRouterProvider extends BaseProvider {
  async fetchModels(): Promise<NewModel[]> {
    const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      throw new Error(
        `OpenRouter models request failed: ${res.status} ${res.statusText}`
      )
    }

    const data = (await res.json()) as OpenRouterModelsResponse

    return data.data
      .filter((m) => {
        const prompt = parseFloat(m.pricing?.prompt || "0")
        const completion = parseFloat(m.pricing?.completion || "0")
        return prompt > 0 || completion > 0
      })
      .map((m) => {
        // OpenRouter pricing is per-token; our schema uses per-1K tokens
        const promptPer1k = parseFloat(m.pricing?.prompt || "0") * 1000
        const completionPer1k = parseFloat(m.pricing?.completion || "0") * 1000
        return {
          provider_id: this.id,
          name: m.id,
          display_name: m.name,
          input_price_per_1k: promptPer1k,
          output_price_per_1k: completionPer1k,
          context_window: m.context_length || 0,
          is_active: 1,
        }
      })
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    // OpenRouter /activity returns the last 30 completed UTC days
    const res = await fetch(`${OPENROUTER_BASE_URL}/activity`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(
          "OpenRouter activity request failed: 403 Forbidden. The /activity endpoint requires a Management API key, not a regular API key. Create one at https://openrouter.ai/keys (select 'Management' key type)."
        )
      }
      throw new Error(
        `OpenRouter activity request failed: ${res.status} ${res.statusText}`
      )
    }

    const data = (await res.json()) as OpenRouterActivityResponse
    const records: NormalizedUsageRecord[] = []

    for (const item of data.data || []) {
      if (!item.date) continue

      const timestamp = new Date(item.date + "T23:59:59Z").getTime()
      if (!Number.isFinite(timestamp)) continue

      const inputTokens = item.prompt_tokens || 0
      const outputTokens = (item.completion_tokens || 0) + (item.reasoning_tokens || 0)

      records.push({
        providerId: this.id,
        modelId: item.model_permaslug || item.model,
        timestamp,
        inputTokens,
        outputTokens,
        costUSD: item.usage || 0,
        requestCount: item.requests || 1,
      })
    }

    if (records.length === 0) {
      this.lastSyncNotes.push(
        "No usage records returned. OpenRouter /activity shows the last 30 completed UTC days — today's usage may not appear until tomorrow. Also ensure you are using a Management API key (not a regular API key) at https://openrouter.ai/keys."
      )
    }

    return records
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${OPENROUTER_BASE_URL}/key`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      return res.ok
    } catch {
      return false
    }
  }
}
