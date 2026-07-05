"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { DailySeriesPoint } from "@/lib/db"
import { formatNumber } from "@/lib/format"

type TokenTrendChartProps = {
  daily: DailySeriesPoint[]
}

export function TokenTrendChart({ daily }: TokenTrendChartProps) {
  const data = daily.map((p) => ({ ...p }))

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="text-sm font-medium">Token Usage</h3>
        <p className="text-xs text-muted-foreground">
          Input vs. output tokens per day
        </p>
      </div>

      {data.length === 0 ? (
        <div className="mt-4 flex h-72 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          No token data yet. Run a sync to populate the dashboard.
        </div>
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="inputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                width={52}
                tickFormatter={(v: number) => formatNumber(v, { compact: true })}
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
                formatter={(value, name) => [
                  formatNumber(Number(value)),
                  name === "input_tokens" ? "Input" : "Output",
                ]}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value) =>
                  value === "input_tokens" ? "Input" : "Output"
                }
              />
              <Area
                type="monotone"
                dataKey="input_tokens"
                stackId="tokens"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#inputGradient)"
              />
              <Area
                type="monotone"
                dataKey="output_tokens"
                stackId="tokens"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#outputGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export { TokenTrendChart as default }
