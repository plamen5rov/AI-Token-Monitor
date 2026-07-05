import { BaseProvider } from "./base"
import { getTemplate } from "@/templates"
import type { NewModel, NormalizedUsageRecord } from "@/types"

type OpenAICompatibleModel = {
  id: string
  object?: string
  owned_by?: string
  context_length?: number
  context_window?: number
}

type OpenAICompatibleModelsResponse = {
  object?: string
  data?: OpenAICompatibleModel[]
}

/**
 * Generic adapter for any OpenAI-compatible inference provider.
 *
 * Reads `baseUrl` and `authMethod` from the provider template, so the same
 * adapter handles Groq, Mistral, Together, DeepSeek, Fireworks, Perplexity,
 * DeepInfra, Anyscale, xAI, NVIDIA NIM, and any future OpenAI-compatible
 * provider without per-provider code.
 *
 * Usage tracking: returns an empty array — these providers do not expose a
 * public REST usage analytics endpoint like OpenAI's `/organization/usage`.
 * Per-request token counts are returned inline by `generateContent` calls,
 * but there is no historical aggregation API. The sync pipeline still runs
 * (model registry is refreshed), but no usage rows are inserted.
 */
export class OpenAICompatibleProvider extends BaseProvider {
  private get baseUrl(): string {
    const template = getTemplate(this.type)
    return template?.baseUrl ?? "https://api.openai.com/v1"
  }

  private get authHeaders(): Record<string, string> {
    const template = getTemplate(this.type)
    const method = template?.authMethod ?? "bearer"
    if (method === "x-api-key") return { "x-api-key": this.apiKey }
    if (method === "x-goog-api-key") return { "x-goog-api-key": this.apiKey }
    return { Authorization: `Bearer ${this.apiKey}` }
  }

  private get displayName(): string {
    return getTemplate(this.type)?.displayName ?? this.type
  }

  private get helpUrl(): string | undefined {
    return getTemplate(this.type)?.apiKeyHelpUrl
  }

  async fetchModels(): Promise<NewModel[]> {
    const res = await fetch(`${this.baseUrl}/models`, {
      headers: this.authHeaders,
    })

    if (!res.ok) {
      const help = this.helpUrl ? ` Verify your API key at ${this.helpUrl}.` : ""
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `${this.displayName} models request failed: ${res.status} ${res.statusText}.${help}`
        )
      }
      throw new Error(
        `${this.displayName} models request failed: ${res.status} ${res.statusText}`
      )
    }

    const data = (await res.json()) as OpenAICompatibleModelsResponse
    const models = data.data ?? []

    return models.map((m) => ({
      provider_id: this.id,
      name: m.id,
      display_name: m.id,
      input_price_per_1k: 0,
      output_price_per_1k: 0,
      context_window: m.context_length ?? m.context_window ?? 0,
      is_active: 1,
    }))
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    return []
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.authHeaders,
      })
      return res.ok
    } catch {
      return false
    }
  }
}