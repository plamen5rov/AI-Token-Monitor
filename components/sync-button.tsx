"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { syncAllAction, syncProviderAction } from "@/app/actions/sync"

export function SyncAllButton({ variant = "outline", size = "sm" }: { variant?: "outline" | "default"; size?: "sm" | "default" }) {
  const [isPending, startTransition] = React.useTransition()
  const [message, setMessage] = React.useState<string | null>(null)

  function handleClick() {
    setMessage(null)
    startTransition(async () => {
      const res = await syncAllAction()
      setMessage(res.message)
    })
  }

  return (
    <Button variant={variant} size={size} className="gap-2" onClick={handleClick} disabled={isPending}>
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Syncing..." : "Sync All"}
      {message ? <span className="ml-2 text-xs text-muted-foreground">{message}</span> : null}
    </Button>
  )
}

export function SyncOneButton({ providerId, providerName }: { providerId: string; providerName: string }) {
  const [isPending, startTransition] = React.useTransition()
  const [message, setMessage] = React.useState<string | null>(null)

  function handleClick() {
    setMessage(null)
    startTransition(async () => {
      const res = await syncProviderAction(providerId)
      setMessage(res.message)
    })
  }

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleClick} disabled={isPending}>
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Syncing..." : `Sync ${providerName}`}
      {message ? <span className="ml-2 text-xs text-muted-foreground">{message}</span> : null}
    </Button>
  )
}