"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { addProviderAction } from "@/app/actions/providers"

type TemplateInfo = {
  type: string
  displayName: string
  description: string
  apiKeyLabel: string
  apiKeyPrefix: string
  apiKeyHelpUrl: string
}

export function ProviderForm({ templates }: { templates: TemplateInfo[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState(templates[0]?.type ?? "")
  const [name, setName] = React.useState("")
  const [apiKey, setApiKey] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  const selected = templates.find((t) => t.type === type)

  function handleOpen() {
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setName("")
    setApiKey("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Provider name is required.")
      return
    }
    if (!apiKey.trim()) {
      toast.error("API key is required.")
      return
    }

    startTransition(async () => {
      const res = await addProviderAction(type, name, apiKey)
      if (res.success) {
        toast.success(res.message)
        setName("")
        setApiKey("")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  if (!open) {
    return (
      <Button variant="default" size="sm" className="gap-2" onClick={handleOpen}>
        <Plus className="h-4 w-4" />
        Add Provider
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Add New Provider</h3>
        <Button variant="ghost" size="icon-sm" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="provider-type">
            Provider Type
          </label>
          <select
            id="provider-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          >
            {templates.map((t) => (
              <option key={t.type} value={t.type}>
                {t.displayName}
              </option>
            ))}
          </select>
          {selected && (
            <p className="text-xs text-muted-foreground">{selected.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="provider-name">
            Display Name
          </label>
          <input
            id="provider-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={selected?.displayName ?? "My Provider"}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="provider-apikey">
              {selected?.apiKeyLabel ?? "API Key"}
            </label>
            {selected?.apiKeyHelpUrl && (
              <a
                href={selected.apiKeyHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Get key →
              </a>
            )}
          </div>
          <input
            id="provider-apikey"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={selected?.apiKeyPrefix ?? "sk-..."}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            Stored encrypted in the local database. Never sent to the browser.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="default" size="sm" disabled={isPending}>
            {isPending ? "Adding..." : "Add Provider"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
