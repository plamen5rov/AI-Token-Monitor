import { BaseProvider } from "./base"
import type { NewModel, NormalizedUsageRecord } from "@/types"

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

type NvidiaModel = {
  id: string
  object?: string
  owned_by?: string
}

type NvidiaModelsResponse = {
  object?: string
  data?: NvidiaModel[]
}

export class NvidiaProvider extends BaseProvider {
  async fetchModels(): Promise<NewModel[]> {
    const res = await fetch(`${NVIDIA_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(
          "NVIDIA NIM models request failed: 401 Unauthorized. Verify your API key at https://build.nvidia.com/ — keys typically start with 'nvapi-'."
        )
      }
      if (res.status === 403) {
        throw new Error(
          "NVIDIA NIM models request failed: 403 Forbidden. Your key may not have access to the models endpoint."
        )
      }
      throw new Error(
        `NVIDIA NIM models request failed: ${res.status} ${res.statusText}`
      )
    }

    const data = (await res.json()) as NvidiaModelsResponse
    const models = data.data ?? []

    return models.map((m) => ({
      provider_id: this.id,
      name: m.id,
      display_name: m.id,
      // NVIDIA NIM does not expose per-token pricing through the models endpoint.
      // Usage costs are billed through NVIDIA's portal, not via API.
      input_price_per_1k: 0,
      output_price_per_1k: 0,
      context_window: 0,
      is_active: 1,
    }))
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    // NVIDIA NIM is inference-only. There is no public usage analytics endpoint.
    // Cost and token usage are surfaced through NVIDIA's billing portal, not API.
    // Returning an empty array keeps the sync pipeline working as a no-op for
    // this provider type while still keeping the model registry up to date.
    return []
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${NVIDIA_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      return res.ok
    } catch {
      return false
    }
  }
}