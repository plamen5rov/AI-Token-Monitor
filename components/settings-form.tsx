"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { saveSettingsAction } from "@/app/actions/settings"

type Props = {
  initialRefreshInterval: string
  initialCurrency: string
}

const CURRENCIES = ["USD", "EUR", "GBP"] as const

export function SettingsForm({ initialRefreshInterval, initialCurrency }: Props) {
  const router = useRouter()
  const [refreshInterval, setRefreshInterval] = React.useState(
    initialRefreshInterval
  )
  const [currency, setCurrency] = React.useState(initialCurrency)
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const res = await saveSettingsAction({ refreshInterval, currency })
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Dashboard</h3>
          <p className="text-xs text-muted-foreground">
            Controls how often the dashboard refreshes its data.
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor="refresh-interval"
          >
            Refresh Interval (minutes)
          </label>
          <input
            id="refresh-interval"
            type="number"
            min={0}
            max={1440}
            step={1}
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            Set to <code className="text-foreground">0</code> to disable
            automatic refresh. Maximum 1440 (24 hours).
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="currency">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Display currency for costs across the dashboard. Provider responses
            are still fetched in USD and converted at display time.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="default" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  )
}