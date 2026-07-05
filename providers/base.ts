import { decrypt } from "@/lib/crypto"
import type { Model, NewModel, NormalizedUsageRecord, Provider } from "@/types"

export interface ProviderAdapter {
  id: string
  name: string
  type: string

  fetchModels(): Promise<NewModel[]>
  fetchUsage(): Promise<NormalizedUsageRecord[]>
  healthCheck(): Promise<boolean>
}

export abstract class BaseProvider implements ProviderAdapter {
  id: string
  name: string
  type: string
  protected apiKey: string

  constructor(provider: Provider) {
    this.id = provider.id
    this.name = provider.name
    this.type = provider.type
    this.apiKey = decrypt(provider.api_key_encrypted)
  }

  abstract fetchModels(): Promise<NewModel[]>
  abstract fetchUsage(): Promise<NormalizedUsageRecord[]>

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchModels()
      return true
    } catch {
      return false
    }
  }

  calculateCost(inputTokens: number, outputTokens: number, model: Model): number {
    return (
      (inputTokens / 1000) * model.input_price_per_1k +
      (outputTokens / 1000) * model.output_price_per_1k
    )
  }
}
