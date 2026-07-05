"use client"

import * as React from "react"
import { Activity, RefreshCw, Trash2, Power } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  deleteProviderAction,
  healthCheckAction,
  syncProviderFromProvidersAction,
  toggleProviderAction,
} from "@/app/actions/providers"

export function ProviderActions({
  providerId,
  isActive,
}: {
  providerId: string
  isActive: boolean
}) {
  const [isSyncing, startSync] = React.useTransition()
  const [isHealthChecking, startHealth] = React.useTransition()
  const [isToggling, startToggle] = React.useTransition()
  const [isDeleting, startDelete] = React.useTransition()
  const [message, setMessage] = React.useState<string | null>(null)
  const [healthStatus, setHealthStatus] = React.useState<"unknown" | "healthy" | "unhealthy">(
    "unknown"
  )

  function handleSync() {
    setMessage(null)
    startSync(async () => {
      const res = await syncProviderFromProvidersAction(providerId)
      setMessage(res.message)
    })
  }

  function handleHealthCheck() {
    setMessage(null)
    startHealth(async () => {
      const res = await healthCheckAction(providerId)
      setHealthStatus(res.healthy ? "healthy" : "unhealthy")
      setMessage(res.message)
    })
  }

  function handleToggle() {
    setMessage(null)
    startToggle(async () => {
      const res = await toggleProviderAction(providerId)
      setMessage(res.message)
    })
  }

  function handleDelete() {
    if (!confirm("Delete this provider? All associated usage data will remain but the provider will be removed.")) return
    setMessage(null)
    startDelete(async () => {
      const res = await deleteProviderAction(providerId)
      setMessage(res.message)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {healthStatus !== "unknown" && (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
              healthStatus === "healthy"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {healthStatus === "healthy" ? "Healthy" : "Unhealthy"}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleSync}
          disabled={isSyncing || !isActive}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          Sync
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleHealthCheck}
          disabled={isHealthChecking}
          title="Health Check"
        >
          <Activity className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleToggle}
          disabled={isToggling}
          title={isActive ? "Disable" : "Enable"}
        >
          <Power className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
