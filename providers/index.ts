import { BaseProvider } from "./base"
import { OpenAIProvider } from "./openai"
import { AnthropicProvider } from "./anthropic"
import { OpenRouterProvider } from "./openrouter"
import { GoogleProvider } from "./google"
import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider } from "@/types"

// Provider types that use the generic OpenAI-compatible adapter.
// All of these expose { data: [...] } /models endpoints and Bearer auth,
// but have no public usage analytics API — fetchUsage returns [].
const OPENAI_COMPATIBLE_TYPES = new Set([
  "nvidia",
  "groq",
  "mistral",
  "together",
  "deepseek",
  "fireworks",
  "perplexity",
  "deepinfra",
  "anyscale",
  "xai",
])

export function createAdapter(provider: Provider): BaseProvider {
  switch (provider.type) {
    case "openai":
      return new OpenAIProvider(provider)
    case "anthropic":
      return new AnthropicProvider(provider)
    case "openrouter":
      return new OpenRouterProvider(provider)
    case "google":
      return new GoogleProvider(provider)
    default:
      if (OPENAI_COMPATIBLE_TYPES.has(provider.type)) {
        return new OpenAICompatibleProvider(provider)
      }
      throw new Error(`Unsupported provider type: ${provider.type}`)
  }
}
