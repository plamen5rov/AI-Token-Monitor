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
    description: "GPT models via the OpenAI API. Uses organization-wide usage endpoint.",
    baseUrl: "https://api.openai.com/v1",
    authMethod: "bearer",
    apiKeyPrefix: "sk-",
    apiKeyLabel: "API Key",
    apiKeyHelpUrl: "https://platform.openai.com/api-keys",
    supportsModels: true,
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
]

export function getTemplate(type: string): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find((t) => t.type === type)
}
