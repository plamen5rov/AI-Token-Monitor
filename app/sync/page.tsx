import { getProviders, getSyncLogs } from "@/lib/db"
import { SyncAllButton, SyncOneButton } from "@/components/sync-button"

export const dynamic = "force-dynamic"

function formatTimestamp(ms: number | null): string {
  if (!ms) return "—"
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "success":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "error":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "partial":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function SyncPage() {
  const providers = getProviders().filter((p) => p.is_active === 1)
  const logs = getSyncLogs(undefined, 50)
  const providerNameById = new Map(providers.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Sync</h2>
          <p className="text-muted-foreground">
            Trigger usage synchronization and review sync history.
          </p>
        </div>
        <SyncAllButton variant="default" size="default" />
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No active providers configured. Add one to start syncing.
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Providers</h3>
          <div className="flex flex-wrap gap-3">
            {providers.map((p) => (
              <SyncOneButton key={p.id} providerId={p.id} providerName={p.name} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium">Sync History</h3>
        </div>
        {logs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No sync runs recorded yet. Use Sync All above to start.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Finished</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const duration =
                  log.started_at && log.finished_at
                    ? `${((log.finished_at - log.started_at) / 1000).toFixed(2)}s`
                    : "—"
                return (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {providerNameById.get(log.provider_id) ?? (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTimestamp(log.started_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTimestamp(log.finished_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{duration}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.error_message ? (
                        <span className="text-destructive">{log.error_message}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}