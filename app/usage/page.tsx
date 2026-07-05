import { BarChart3 } from "lucide-react"

import {
  getDailySeries,
  getModels,
  getMonthlySeries,
  getUsageDaily,
} from "@/lib/db"
import { formatCurrency, formatNumber } from "@/lib/format"
import { CostTrendChart } from "@/components/dashboard/cost-trend-chart"
import { TokenTrendChart } from "@/components/dashboard/token-trend-chart"

export const dynamic = "force-dynamic"

export default function UsagePage() {
  const daily = getDailySeries({ limit: 90 })
  const monthly = getMonthlySeries({ limit: 12 })
  const models = getModels()

  // Per-model usage aggregated across all providers
  const modelUsage = models
    .map((m) => {
      const rows = getUsageDaily({ providerId: m.provider_id, limit: 365 })
      const modelRows = rows.filter((r) => r.model_id === m.id)
      const inputTokens = modelRows.reduce(
        (sum, r) => sum + r.total_input_tokens,
        0
      )
      const outputTokens = modelRows.reduce(
        (sum, r) => sum + r.total_output_tokens,
        0
      )
      const cost = modelRows.reduce((sum, r) => sum + r.total_cost_usd, 0)
      const requests = modelRows.reduce(
        (sum, r) => sum + r.total_requests,
        0
      )
      return {
        id: m.id,
        name: m.display_name || m.name,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost,
        requests,
      }
    })
    .filter((m) => m.totalTokens > 0 || m.cost > 0)
    .sort((a, b) => b.cost - a.cost)

  const totalInput = modelUsage.reduce((s, m) => s + m.inputTokens, 0)
  const totalOutput = modelUsage.reduce((s, m) => s + m.outputTokens, 0)
  const totalCost = modelUsage.reduce((s, m) => s + m.cost, 0)
  const totalRequests = modelUsage.reduce((s, m) => s + m.requests, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
        <p className="text-muted-foreground">
          Detailed token usage and cost breakdown per model.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Input Tokens</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatNumber(totalInput, { compact: true })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Output Tokens</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatNumber(totalOutput, { compact: true })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Requests</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatNumber(totalRequests, { compact: true })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CostTrendChart daily={daily} monthly={monthly} />
        <TokenTrendChart daily={daily} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium">Per-Model Usage</h3>
        </div>
        {modelUsage.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No usage data yet. Sync a provider to see per-model breakdowns.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium text-right">Input</th>
                  <th className="px-4 py-2 font-medium text-right">Output</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-right">Requests</th>
                  <th className="px-4 py-2 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {modelUsage.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(m.inputTokens, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(m.outputTokens, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(m.totalTokens, { compact: true })}
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
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="px-4 py-3 font-semibold">Total</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(totalInput, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(totalOutput, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatNumber(totalInput + totalOutput, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(totalRequests, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}