import type { RecentActivityRow } from "@/lib/db"
import { formatCurrency, formatNumber, formatTimestamp } from "@/lib/format"

export function RecentActivity({ rows }: { rows: RecentActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No activity yet. Run a sync to populate usage records.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Recent Activity</h3>
        <p className="text-xs text-muted-foreground">
          Latest usage buckets recorded
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 font-medium">Provider</th>
            <th className="px-4 py-2 font-medium">Model</th>
            <th className="px-4 py-2 text-right font-medium">Tokens</th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
            <th className="px-4 py-2 text-right font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3">{row.provider_name}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {row.model_name ?? "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatNumber(row.total_tokens, { compact: true })}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(row.cost_usd)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatTimestamp(row.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
