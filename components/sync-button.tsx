"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { syncAllAction, syncProviderAction } from "@/app/actions/sync"

export function SyncAllButton({
  variant = "outline",
  size = "sm",
}: {
  variant?: "outline" | "default"
  size?: "sm" | "default"
}) {
  const [isPending, startTransition] = React.useTransition()

  function handleClick() {
    startTransition(async () => {
      const res = await syncAllAction()
      if (res.message.includes("failed") || res.message.includes("No active")) {
        toast.error(res.message)
      } else {
        toast.success(res.message)
      }
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      className="gap-2"
      onClick={handleClick}
      disabled={isPending}
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Syncing..." : "Sync All"}
    </Button>
  )
}

export function SyncOneButton({
  providerId,
  providerName,
}: {
  providerId: string
  providerName: string
}) {
  const [isPending, startTransition] = React.useTransition()

  function handleClick() {
    startTransition(async () => {
      const res = await syncProviderAction(providerId)
      if (res.result.status === "success") {
        toast.success(`Synced ${providerName}: ${res.message}`)
      } else {
        toast.error(`${providerName}: ${res.message}`)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleClick}
      disabled={isPending}
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Syncing..." : `Sync ${providerName}`}
    </Button>
  )
}