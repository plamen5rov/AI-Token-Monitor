import { BaseProvider } from "./base"
import { OpenAIProvider } from "./openai"
import { AnthropicProvider } from "./anthropic"
import { OpenRouterProvider } from "./openrouter"
import type { Provider } from "@/types"

export function createAdapter(provider: Provider): BaseProvider {
  switch (provider.type) {
    case "openai":
      return new OpenAIProvider(provider)
    case "anthropic":
      return new AnthropicProvider(provider)
    case "openrouter":
      return new OpenRouterProvider(provider)
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`)
  }
}
