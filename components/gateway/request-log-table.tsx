"use client"

import { Network } from "lucide-react"

import { formatNumber, formatRelative } from "@/lib/format"
import type { RequestLog } from "@/types"

function statusColor(status: number | null): string {
  if (!status) return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
  if (status >= 200 && status < 300) return "bg-green-500/10 text-green-600 dark:text-green-400"
  if (status >= 400 && status < 500) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
  if (status >= 500) return "bg-red-500/10 text-red-600 dark:text-red-400"
  return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
}

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "POST": return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    case "GET": return "bg-green-500/10 text-green-600 dark:text-green-400"
    case "PUT": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
    case "DELETE": return "bg-red-500/10 text-red-600 dark:text-red-400"
    default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
  }
}

type Props = {
  logs: RequestLog[]
}

export function RequestLogTable({ logs }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Request Log</h3>
      </div>
      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <Network className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No requests yet. Point your app at the gateway to start logging.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Model</th>
                <th className="px-4 py-2 font-medium">Endpoint</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Tokens</th>
                <th className="px-4 py-2 font-medium text-right">Latency</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatRelative(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.provider}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.model ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    /{log.endpoint}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${methodColor(log.method)}`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(log.status)}`}>
                      {log.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {log.input_tokens + log.output_tokens > 0
                      ? formatNumber(log.input_tokens + log.output_tokens, { compact: true })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {log.latency_ms > 0 ? `${log.latency_ms}ms` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
