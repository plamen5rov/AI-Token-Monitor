import { BaseProvider } from "./base"
import { OpenAIProvider } from "./openai"
import type { Provider } from "@/types"

export function createAdapter(provider: Provider): BaseProvider {
  switch (provider.type) {
    case "openai":
      return new OpenAIProvider(provider)
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`)
  }
}
