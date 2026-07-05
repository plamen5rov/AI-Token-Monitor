import { getSetting } from "@/lib/db"
import { SettingsForm } from "@/components/settings-form"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  const refreshInterval = getSetting("refresh_interval") ?? "15"
  const currency = getSetting("currency") ?? "USD"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure dashboard preferences and application options.
        </p>
      </div>

      <SettingsForm
        initialRefreshInterval={refreshInterval}
        initialCurrency={currency}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold">About</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          AI Token Monitor (ATM) — self-hostable dashboard for tracking AI API
          usage and costs across providers. Data is stored locally in SQLite;
          API keys are encrypted at rest and never sent to the browser.
        </p>
      </div>
    </div>
  )
}