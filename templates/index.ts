export type ProviderTemplate = {
  type: string
  displayName: string
  description: string
  baseUrl: string
  authMethod: "bearer" | "x-api-key"
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
    description: "GPT models via the OpenAI API. Usage endpoint requires an Admin API key (sk-admin-...), not a standard project key.",
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
]

export function getTemplate(type: string): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find((t) => t.type === type)
}
