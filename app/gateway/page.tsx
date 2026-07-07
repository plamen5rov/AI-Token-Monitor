import { Network } from "lucide-react"

import { getRequestLogs, getRequestLogStats } from "@/lib/db"
import { formatCurrency, formatNumber, formatRelative } from "@/lib/format"
import { VirtualKeyManager } from "@/components/gateway/virtual-key-manager"
import { BudgetManager } from "@/components/gateway/budget-manager"
import { RequestLogTable } from "@/components/gateway/request-log-table"

export const dynamic = "force-dynamic"

export default function GatewayPage() {
  const stats = getRequestLogStats()
  const logs = getRequestLogs({ limit: 100 })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Gateway</h2>
        <p className="text-muted-foreground">
          Real-time request logging and virtual key management. Point your apps
          at <code className="text-xs bg-muted px-1 py-0.5 rounded">http://localhost:3000/api/gateway/[provider]/</code> to
          start tracking.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Requests</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatNumber(stats.total_requests, { compact: true })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(stats.total_cost_usd)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Tokens</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatNumber(stats.total_input_tokens + stats.total_output_tokens, { compact: true })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Latency</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats.avg_latency_ms > 0
              ? `${Math.round(stats.avg_latency_ms)}ms`
              : "—"}
          </p>
        </div>
      </div>

      <VirtualKeyManager />

      <BudgetManager />

      <RequestLogTable logs={logs} />
    </div>
  )
}
