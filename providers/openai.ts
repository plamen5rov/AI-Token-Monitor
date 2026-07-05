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
}

type OpenAIModel = {
  id: string
  object: string
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
}

export class OpenAIProvider extends BaseProvider {
  async fetchModels(): Promise<NewModel[]> {
    const res = await fetch(`${OPENAI_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      throw new Error(`OpenAI models request failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as { data: OpenAIModel[] }
    return data.data
      .filter((m) => PRICING[m.id])
      .map((m) => {
        const price = PRICING[m.id]
        return {
          provider_id: this.id,
          name: m.id,
          display_name: m.id,
          input_price_per_1k: price.input,
          output_price_per_1k: price.output,
          context_window: 0,
          is_active: 1,
        }
      })
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    const end = Math.floor(Date.now() / 1000)
    const start = end - 30 * 24 * 60 * 60

    const url = new URL(`${OPENAI_BASE_URL}/organization/usage/completions`)
    url.searchParams.set("start_time", String(start))
    url.searchParams.set("end_time", String(end))
    url.searchParams.set("bucket_width", "1d")
    url.searchParams.set("group_by", "model")
    url.searchParams.set("limit", "30")

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      throw new Error(`OpenAI usage request failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as OpenAIUsageResponse
    const records: NormalizedUsageRecord[] = []

    for (const bucket of data.data || []) {
      const timestamp = bucket.end_time * 1000
      for (const result of bucket.results || []) {
        records.push({
          providerId: this.id,
          modelId: result.model,
          timestamp,
          inputTokens: result.input_tokens || 0,
          outputTokens: result.output_tokens || 0,
          costUSD: 0,
        })
      }
    }

    return records
  }
}
