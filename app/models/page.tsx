import { Boxes } from "lucide-react"

import { getModels, getProviders, getUsageDaily } from "@/lib/db"
import { formatCurrency, formatNumber } from "@/lib/format"

export const dynamic = "force-dynamic"

export default function ModelsPage() {
  const models = getModels()
  const providers = getProviders()
  const providerNameById = new Map(providers.map((p) => [p.id, p.name]))

  // Aggregate per-model usage from usage_daily
  const daily = getUsageDaily({ limit: 365 })
  const usageByModelId = new Map<
    string,
    { inputTokens: number; outputTokens: number; cost: number; requests: number }
  >()
  for (const r of daily) {
    if (!r.model_id) continue
    const entry =
      usageByModelId.get(r.model_id) ?? {
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        requests: 0,
      }
    entry.inputTokens += r.total_input_tokens
    entry.outputTokens += r.total_output_tokens
    entry.cost += r.total_cost_usd
    entry.requests += r.total_requests
    usageByModelId.set(r.model_id, entry)
  }

  const rows = models
    .map((m) => {
      const usage = usageByModelId.get(m.id) ?? {
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        requests: 0,
      }
      return {
        id: m.id,
        name: m.display_name || m.name,
        provider: providerNameById.get(m.provider_id) ?? "Unknown",
        contextWindow: m.context_window,
        inputPrice: m.input_price_per_1k,
        outputPrice: m.output_price_per_1k,
        isActive: m.is_active === 1,
        ...usage,
      }
    })
    .sort((a, b) => b.cost - a.cost)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Models</h2>
        <p className="text-muted-foreground">
          Per-model pricing and usage across all providers.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <Boxes className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No models yet. Sync a provider to populate the model list.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Provider</th>
                  <th className="px-4 py-2 font-medium text-right">
                    Context
                  </th>
                  <th className="px-4 py-2 font-medium text-right">
                    In $/1k
                  </th>
                  <th className="px-4 py-2 font-medium text-right">
                    Out $/1k
                  </th>
                  <th className="px-4 py-2 font-medium text-right">Input</th>
                  <th className="px-4 py-2 font-medium text-right">Output</th>
                  <th className="px-4 py-2 font-medium text-right">Requests</th>
                  <th className="px-4 py-2 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {m.name}
                        {!m.isActive && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.provider}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {m.contextWindow > 0
                        ? formatNumber(m.contextWindow, { compact: true })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatCurrency(m.inputPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatCurrency(m.outputPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(m.inputTokens, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(m.outputTokens, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(m.requests, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(m.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}