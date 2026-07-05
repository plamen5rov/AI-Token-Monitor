import type { ProviderBreakdownRow } from "@/lib/db"
import { formatCurrency, formatNumber, formatRelative } from "@/lib/format"

export function ProviderBreakdown({ rows }: { rows: ProviderBreakdownRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No providers configured yet. Add one on the Providers page.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Provider Breakdown</h3>
        <p className="text-xs text-muted-foreground">
          Spend and usage per provider
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 font-medium">Provider</th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
            <th className="px-4 py-2 text-right font-medium">Tokens</th>
            <th className="px-4 py-2 text-right font-medium">Requests</th>
            <th className="px-4 py-2 text-right font-medium">Last Sync</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.provider_id}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3 font-medium">{row.provider_name}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(row.total_cost_usd)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatNumber(row.total_input_tokens + row.total_output_tokens, {
                  compact: true,
                })}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatNumber(row.total_requests)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatRelative(row.last_sync)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
