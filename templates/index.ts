export type ProviderTemplate = {
  type: string
  displayName: string
  description: string
  baseUrl: string
  authMethod: "bearer" | "x-api-key" | "x-goog-api-key"
  apiKeyPrefix: string
  apiKeyLabel: string
  apiKeyHelpUrl: string
  supportsModels: boolean
  supportsUsage: boolean
}

export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    type: "openai",
    displayName: "OpenAI",
    description: "GPT models via the OpenAI API. Usage and costs endpoints require an Admin API key (sk-admin-...), not a standard project key.",
    baseUrl: "https://api.openai.com/v1",
    authMethod: "bearer",
    apiKeyPrefix: "sk-admin-",
    apiKeyLabel: "Admin API Key",
    apiKeyHelpUrl: "https://platform.openai.com/settings/organization/admin-keys",
    supportsModels: false,
    supportsUsage: true,
  },
  {
    type: "anthropic",
    displayName: "Anthropic",
    description:
      "Claude models via the Anthropic Admin API. Requires an Admin API key (sk-ant-admin01-...), not a standard API key.",
    baseUrl: "https://api.anthropic.com/v1",
    authMethod: "x-api-key",
    apiKeyPrefix: "sk-ant-admin01-",
    apiKeyLabel: "Admin API Key",
    apiKeyHelpUrl: "https://console.anthropic.com/settings/admin-keys",
    supportsModels: false,
    supportsUsage: true,
  },
  {
    type: "openrouter",
    displayName: "OpenRouter",
    description:
      "400+ models via OpenRouter. Requires a Management API key for usage data. Pricing fetched from the models endpoint.",
    baseUrl: "https://openrouter.ai/api/v1",
    authMethod: "bearer",
    apiKeyPrefix: "sk-or-",
    apiKeyLabel: "Management API Key",
    apiKeyHelpUrl: "https://openrouter.ai/keys",
    supportsModels: true,
    supportsUsage: true,
  },
  {
    type: "nvidia",
    displayName: "NVIDIA NIM",
    description:
      "Llama, Nemotron, and other models via NVIDIA NIM. Tracks the model registry only — NIM has no public usage endpoint, so cost/token usage is not fetched.",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    authMethod: "bearer",
    apiKeyPrefix: "nvapi-",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://build.nvidia.com/",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "google",
    displayName: "Google AI Studio",
    description:
      "Gemini models via Google AI Studio. Tracks the model registry only — Google does not expose a public REST usage endpoint; analytics are surfaced in aistudio.google.com/usage.",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    authMethod: "x-goog-api-key",
    apiKeyPrefix: "AIza",
    apiKeyLabel: "Gemini API Key",
    apiKeyHelpUrl: "https://aistudio.google.com/apikey",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "groq",
    displayName: "Groq",
    description:
      "Llama, Mixtral, and other models on Groq's LPU inference engine. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.groq.com/openai/v1",
    authMethod: "bearer",
    apiKeyPrefix: "gsk_",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://console.groq.com/keys",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "mistral",
    displayName: "Mistral",
    description:
      "Mistral and Codestral models via La Plateforme. OpenAI-compatible API; no public usage endpoint — usage is surfaced in console.mistral.ai/usage.",
    baseUrl: "https://api.mistral.ai/v1",
    authMethod: "bearer",
    apiKeyPrefix: "",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://console.mistral.ai/api-keys/",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "together",
    displayName: "Together AI",
    description:
      "Llama, Qwen, DeepSeek, and 200+ open-source models on Together AI. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.together.xyz/v1",
    authMethod: "bearer",
    apiKeyPrefix: "",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://api.together.ai/settings/api-keys",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "deepseek",
    displayName: "DeepSeek",
    description:
      "DeepSeek-V3, DeepSeek-R1, and Qwen models. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.deepseek.com/v1",
    authMethod: "bearer",
    apiKeyPrefix: "sk-",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://platform.deepseek.com/api_keys",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "fireworks",
    displayName: "Fireworks AI",
    description:
      "Llama, Mixtral, DeepSeek, and serverless models on Fireworks AI. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    authMethod: "bearer",
    apiKeyPrefix: "",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://fireworks.ai/account/api-keys",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "perplexity",
    displayName: "Perplexity",
    description:
      "Sonar and llama models via Perplexity's online API. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.perplexity.ai",
    authMethod: "bearer",
    apiKeyPrefix: "pplx-",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://docs.perplexity.ai/docs/getting-started/getting-started-chat",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "deepinfra",
    displayName: "DeepInfra",
    description:
      "Llama, Qwen, and open-source models on DeepInfra. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.deepinfra.com/v1/openai",
    authMethod: "bearer",
    apiKeyPrefix: "",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://deepinfra.com/dash/api_keys",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "anyscale",
    displayName: "Anyscale",
    description:
      "Llama, Mistral, and open-source models on Anyscale Endpoints. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.endpoints.anyscale.com/v1",
    authMethod: "bearer",
    apiKeyPrefix: "",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://app.endpoints.anyscale.com/credentials",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "xai",
    displayName: "xAI (Grok)",
    description:
      "Grok models via xAI. OpenAI-compatible API; no public usage endpoint.",
    baseUrl: "https://api.x.ai/v1",
    authMethod: "bearer",
    apiKeyPrefix: "xai-",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://console.x.ai",
    supportsModels: true,
    supportsUsage: false,
  },
  {
    type: "opencode",
    displayName: "OpenCode Zen",
    description:
      "Curated, verified models (GPT, Claude, Gemini, DeepSeek, MiniMax, GLM, Kimi, and more) via the OpenCode Zen gateway. OpenAI-compatible API; no public usage endpoint — usage is surfaced in opencode.ai/settings/usage.",
    baseUrl: "https://opencode.ai/zen/v1",
    authMethod: "bearer",
    apiKeyPrefix: "",
    apiKeyLabel: "Zen API Key",
    apiKeyHelpUrl: "https://opencode.ai/settings/keys",
    supportsModels: true,
    supportsUsage: false,
  },
]

export function getTemplate(type: string): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find((t) => t.type === type)
}
