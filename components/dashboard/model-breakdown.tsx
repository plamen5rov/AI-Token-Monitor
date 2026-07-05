import type { ModelBreakdownRow } from "@/lib/db"
import { formatCurrency, formatNumber } from "@/lib/format"

export function ModelBreakdown({ rows }: { rows: ModelBreakdownRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No models recorded yet. Models appear after the first successful sync.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Model Breakdown</h3>
        <p className="text-xs text-muted-foreground">
          Top models by spend
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 font-medium">Model</th>
            <th className="px-4 py-2 font-medium">Provider</th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
            <th className="px-4 py-2 text-right font-medium">Tokens</th>
            <th className="px-4 py-2 text-right font-medium">Requests</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.model_id}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3 font-mono text-xs">{row.model_name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.provider_name}
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
