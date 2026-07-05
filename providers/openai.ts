import { BaseProvider } from "./base"
import type { NewModel, NormalizedUsageRecord } from "@/types"

const OPENAI_BASE_URL = "https://api.openai.com/v1"

const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-2024-08-06": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o-mini-2024-07-18": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4-turbo-2024-04-09": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
  "o1": { input: 15, output: 60 },
  "o1-2024-12-17": { input: 15, output: 60 },
  "o1-preview": { input: 15, output: 60 },
  "o1-preview-2024-09-12": { input: 15, output: 60 },
  "o1-mini": { input: 3, output: 12 },
  "o1-mini-2024-09-12": { input: 3, output: 12 },
  "o3-mini": { input: 1.1, output: 4.4 },
  "o3-mini-2025-01-31": { input: 1.1, output: 4.4 },
}

type OpenAIUsageResult = {
  model: string
  input_tokens: number
  output_tokens: number
  num_model_requests?: number
}

type OpenAIUsageBucket = {
  start_time: number
  end_time: number
  results: OpenAIUsageResult[]
}

type OpenAIUsageResponse = {
  data: OpenAIUsageBucket[]
  next_page?: string
}

export class OpenAIProvider extends BaseProvider {
  async fetchModels(): Promise<NewModel[]> {
    return Object.keys(PRICING).map((name) => {
      const price = PRICING[name]
      return {
        provider_id: this.id,
        name,
        display_name: name,
        input_price_per_1k: price.input,
        output_price_per_1k: price.output,
        context_window: 0,
        is_active: 1,
      }
    })
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    const records: NormalizedUsageRecord[] = []
    const end = Math.floor(Date.now() / 1000)
    const start = end - 30 * 24 * 60 * 60

    let page: string | undefined
    do {
      const url = new URL(`${OPENAI_BASE_URL}/organization/usage/completions`)
      url.searchParams.set("start_time", String(start))
      url.searchParams.set("end_time", String(end))
      url.searchParams.set("bucket_width", "1d")
      url.searchParams.set("group_by", "model")
      url.searchParams.set("limit", "31")
      if (page) url.searchParams.set("page", page)

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(
            "OpenAI usage request failed: 403 Forbidden. The /organization/usage endpoint requires an Admin API key (sk-admin-...), not a standard project key (sk-proj-...). Create one at https://platform.openai.com/settings/organization/admin-keys"
          )
        }
        throw new Error(`OpenAI usage request failed: ${res.status} ${res.statusText}`)
      }

      const data = (await res.json()) as OpenAIUsageResponse

      for (const bucket of data.data || []) {
        const timestamp = bucket.end_time * 1000
        if (!Number.isFinite(timestamp)) continue
        for (const result of bucket.results || []) {
          records.push({
            providerId: this.id,
            modelId: result.model,
            timestamp,
            inputTokens: result.input_tokens || 0,
            outputTokens: result.output_tokens || 0,
            costUSD: 0,
            requestCount: result.num_model_requests || 1,
          })
        }
      }

      page = data.next_page
    } while (page)

    return records
  }

  async healthCheck(): Promise<boolean> {
    try {
      const end = Math.floor(Date.now() / 1000)
      const start = end - 24 * 60 * 60
      const url = new URL(`${OPENAI_BASE_URL}/organization/usage/completions`)
      url.searchParams.set("start_time", String(start))
      url.searchParams.set("end_time", String(end))
      url.searchParams.set("bucket_width", "1d")
      url.searchParams.set("limit", "1")

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      return res.ok
    } catch {
      return false
    }
  }
}
