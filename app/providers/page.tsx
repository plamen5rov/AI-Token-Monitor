import { getProviders } from "@/lib/db"
import { PROVIDER_TEMPLATES } from "@/templates"
import { ProviderForm } from "@/components/provider-form"
import { ProviderActions } from "@/components/provider-actions"

export const dynamic = "force-dynamic"

function formatTimestamp(ms: number | null): string {
  if (!ms) return "Never"
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case "openai":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "anthropic":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    case "openrouter":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "nvidia":
      return "bg-lime-500/10 text-lime-600 border-lime-500/20"
    case "google":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "groq":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20"
    case "mistral":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    case "together":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "deepseek":
      return "bg-violet-500/10 text-violet-500 border-violet-500/20"
    case "fireworks":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20"
    case "perplexity":
      return "bg-teal-500/10 text-teal-500 border-teal-500/20"
    case "deepinfra":
      return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
    case "anyscale":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    case "xai":
      return "bg-zinc-500/10 text-zinc-300 border-zinc-500/20"
    case "opencode":
      return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20"
    case "opencode-local":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function ProvidersPage() {
  const providers = getProviders()
  const templateDisplayName = new Map(PROVIDER_TEMPLATES.map((t) => [t.type, t.displayName]))
  const templateSupportsUsage = new Map(PROVIDER_TEMPLATES.map((t) => [t.type, t.supportsUsage]))

  const templatesForUI = PROVIDER_TEMPLATES.map((t) => ({
    type: t.type,
    displayName: t.displayName,
    description: t.description,
    apiKeyLabel: t.apiKeyLabel,
    apiKeyPrefix: t.apiKeyPrefix,
    apiKeyHelpUrl: t.apiKeyHelpUrl,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Providers</h2>
          <p className="text-muted-foreground">
            Add, configure, and manage your AI provider connections.
          </p>
        </div>
        <ProviderForm templates={templatesForUI} />
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No providers configured yet. Click <span className="font-medium text-foreground">Add Provider</span> to get started.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {PROVIDER_TEMPLATES.map((t) => (
              <div
                key={t.type}
                className="rounded-lg border border-border bg-background p-4 text-left"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${typeBadgeClass(
                      t.type
                    )}`}
                  >
                    {t.displayName}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-xs">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${typeBadgeClass(
                        p.type
                      )}`}
                    >
                      {templateDisplayName.get(p.type) ?? p.type}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                        p.is_active === 1
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {p.is_active === 1 ? "Active" : "Disabled"}
                    </span>
                    {templateSupportsUsage.get(p.type) === false && (
                      <span
                        title="This provider has no public usage endpoint. Sync will refresh the model list only; token/cost data is not fetched."
                        className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600"
                      >
                        Models only
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last sync: {formatTimestamp(p.last_sync)}
                  </p>
                </div>
              </div>
              <ProviderActions providerId={p.id} providerName={p.name} isActive={p.is_active === 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
