import { BaseProvider } from "./base"
import type { NewModel, NormalizedUsageRecord } from "@/types"

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1"
const ANTHROPIC_VERSION = "2023-06-01"

// Per-1K-token pricing. Source: https://platform.claude.com/docs/en/about-claude/pricing
// Values are per-1K (per-MTok / 1000).
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 0.005, output: 0.025 },
  "claude-opus-4-7": { input: 0.005, output: 0.025 },
  "claude-opus-4-6": { input: 0.005, output: 0.025 },
  "claude-opus-4-5": { input: 0.005, output: 0.025 },
  "claude-opus-4-1": { input: 0.015, output: 0.075 },
  "claude-opus-4": { input: 0.015, output: 0.075 },
  "claude-sonnet-5": { input: 0.002, output: 0.01 },
  "claude-sonnet-4-6": { input: 0.003, output: 0.015 },
  "claude-sonnet-4-5": { input: 0.003, output: 0.015 },
  "claude-sonnet-4": { input: 0.003, output: 0.015 },
  "claude-haiku-4-5": { input: 0.001, output: 0.005 },
  "claude-haiku-3-5": { input: 0.0008, output: 0.004 },
}

function priceForModel(modelId: string): { input: number; output: number } | undefined {
  if (PRICING[modelId]) return PRICING[modelId]
  // Try prefix match: "claude-opus-4-8-20250115" → "claude-opus-4-8"
  const prefix = modelId.replace(/-\d{8}$/, "")
  if (PRICING[prefix]) return PRICING[prefix]
  return undefined
}

// All known models for the hardcoded model list (Anthropic has no /models endpoint)
const KNOWN_MODELS = Object.keys(PRICING)

type AnthropicUsageBucket = {
  starting_at: string
  ending_at: string
  usage: AnthropicUsageResult[]
}

type AnthropicUsageResult = {
  model: string
  uncached_input_tokens: number
  cached_input_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  output_tokens: number
  num_model_requests?: number
}

type AnthropicUsageResponse = {
  data: AnthropicUsageBucket[]
  next_page?: string
}

export class AnthropicProvider extends BaseProvider {
  async fetchModels(): Promise<NewModel[]> {
    // Anthropic does not expose a /models endpoint.
    // Return the hardcoded model list with pricing.
    return KNOWN_MODELS.map((name) => {
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
    const endingAt = new Date()
    const startingAt = new Date(endingAt.getTime() - 30 * 24 * 60 * 60 * 1000)

    const records = await this.fetchUsagePage(startingAt, endingAt, undefined)
    return records
  }

  private async fetchUsagePage(
    startingAt: Date,
    endingAt: Date,
    page: string | undefined
  ): Promise<NormalizedUsageRecord[]> {
    const url = new URL(`${ANTHROPIC_BASE_URL}/organizations/usage_report/messages`)
    url.searchParams.set("starting_at", startingAt.toISOString())
    url.searchParams.set("ending_at", endingAt.toISOString())
    url.searchParams.set("bucket_width", "1d")
    url.searchParams.set("group_by[]", "model")
    if (page) url.searchParams.set("page", page)

    const res = await fetch(url, {
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
    })

    if (!res.ok) {
      throw new Error(
        `Anthropic usage request failed: ${res.status} ${res.statusText}`
      )
    }

    const data = (await res.json()) as AnthropicUsageResponse
    const records: NormalizedUsageRecord[] = []

    for (const bucket of data.data || []) {
      // Use bucket ending_at as the timestamp (end of day, ms)
      const timestamp = new Date(bucket.ending_at).getTime()
      for (const result of bucket.usage || []) {
        const inputTokens =
          (result.uncached_input_tokens || 0) +
          (result.cached_input_tokens || 0) +
          (result.cache_creation_input_tokens || 0) +
          (result.cache_read_input_tokens || 0)
        const outputTokens = result.output_tokens || 0
        const requestCount = result.num_model_requests || 1

        const price = priceForModel(result.model)
        const costUSD = price
          ? (inputTokens / 1000) * price.input +
            (outputTokens / 1000) * price.output
          : 0

        records.push({
          providerId: this.id,
          modelId: result.model,
          timestamp,
          inputTokens,
          outputTokens,
          costUSD,
          requestCount,
        })
      }
    }

    // Handle pagination
    if (data.next_page) {
      const more = await this.fetchUsagePage(startingAt, endingAt, data.next_page)
      records.push(...more)
    }

    return records
  }

  async healthCheck(): Promise<boolean> {
    try {
      const endingAt = new Date()
      const startingAt = new Date(endingAt.getTime() - 24 * 60 * 60 * 1000)
      const url = new URL(`${ANTHROPIC_BASE_URL}/organizations/usage_report/messages`)
      url.searchParams.set("starting_at", startingAt.toISOString())
      url.searchParams.set("ending_at", endingAt.toISOString())
      url.searchParams.set("bucket_width", "1d")

      const res = await fetch(url, {
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
      })
      return res.ok
    } catch {
      return false
    }
  }
}
