"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { DailySeriesPoint, MonthlySeriesPoint } from "@/lib/db"
import { formatCurrency } from "@/lib/format"

type SeriesPoint = {
  date: string
  cost_usd: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  requests: number
}

type CostTrendChartProps = {
  daily: DailySeriesPoint[]
  monthly: MonthlySeriesPoint[]
}

export function CostTrendChart({ daily, monthly }: CostTrendChartProps) {
  const [view, setView] = React.useState<"daily" | "monthly">("daily")
  const data: SeriesPoint[] =
    view === "daily"
      ? daily.map((p) => ({ ...p }))
      : monthly.map((p) => ({ ...p, date: p.month }))

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Cost Trend</h3>
          <p className="text-xs text-muted-foreground">
            Spending over time
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setView("daily")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              view === "daily"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setView("monthly")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              view === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-4 flex h-72 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          No usage data yet. Run a sync to populate the dashboard.
        </div>
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                }}
                formatter={(value) => [formatCurrency(Number(value)), "Cost"]}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Area
                type="monotone"
                dataKey="cost_usd"
                name="Cost"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#costGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export { CostTrendChart as default }
