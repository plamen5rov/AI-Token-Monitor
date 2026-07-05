import {
  Activity,
  CircleDollarSign,
  Cpu,
  Server,
  Zap,
} from "lucide-react"

import { MetricCard } from "@/components/dashboard/metric-card"
import { CostTrendChart } from "@/components/dashboard/cost-trend-chart"
import { TokenTrendChart } from "@/components/dashboard/token-trend-chart"
import { ProviderBreakdown } from "@/components/dashboard/provider-breakdown"
import { ModelBreakdown } from "@/components/dashboard/model-breakdown"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import {
  getActiveProvidersCount,
  getDashboardTotals,
  getDailySeries,
  getModelBreakdown,
  getMonthlySeries,
  getProviderBreakdown,
  getRecentActivity,
  getRequestsTodayCount,
} from "@/lib/db"
import { formatCurrency, formatNumber } from "@/lib/format"

export const dynamic = "force-dynamic"

export default function OverviewPage() {
  const totals = getDashboardTotals()
  const activeProviders = getActiveProvidersCount()
  const requestsToday = getRequestsTodayCount()
  const daily = getDailySeries({ limit: 90 })
  const monthly = getMonthlySeries({ limit: 12 })
  const providers = getProviderBreakdown()
  const models = getModelBreakdown(10)
  const recent = getRecentActivity(15)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Track your AI usage and costs across providers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Cost"
          value={formatCurrency(totals.total_cost_usd)}
          hint="All time, all providers"
          icon={CircleDollarSign}
        />
        <MetricCard
          title="Tokens Used"
          value={formatNumber(
            totals.total_input_tokens + totals.total_output_tokens,
            { compact: true }
          )}
          hint={`${formatNumber(totals.total_input_tokens, { compact: true })} in / ${formatNumber(
            totals.total_output_tokens,
            { compact: true }
          )} out`}
          icon={Zap}
        />
        <MetricCard
          title="Active Providers"
          value={formatNumber(activeProviders)}
          hint="Enabled and ready to sync"
          icon={Server}
        />
        <MetricCard
          title="Requests Today"
          value={formatNumber(requestsToday)}
          hint={`${formatNumber(totals.total_requests, { compact: true })} total all-time`}
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CostTrendChart daily={daily} monthly={monthly} />
        <TokenTrendChart daily={daily} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProviderBreakdown rows={providers} />
        <ModelBreakdown rows={models} />
      </div>

      <RecentActivity rows={recent} />

      <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
        <Cpu className="h-3 w-3" />
        <span>
          Data updates after each sync. Use Sync in the top bar to refresh.
        </span>
      </div>
    </div>
  )
}
