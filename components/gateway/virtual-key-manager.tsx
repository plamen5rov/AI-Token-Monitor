"use client"

import { useState } from "react"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"

import { createVirtualKeyAction, deleteVirtualKeyAction, getVirtualKeysAction } from "@/app/actions/gateway"
import { formatRelative } from "@/lib/format"
import type { VirtualKey } from "@/types"

export function VirtualKeyManager() {
  const [keys, setKeys] = useState<VirtualKey[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyProvider, setNewKeyProvider] = useState("openai")
  const [newKeyBudget, setNewKeyBudget] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const loadKeys = async () => {
    const result = await getVirtualKeysAction()
    setKeys(result)
    setLoaded(true)
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    const result = await createVirtualKeyAction(
      newKeyName.trim(),
      newKeyProvider,
      newKeyBudget ? parseFloat(newKeyBudget) : undefined
    )
    if (result) {
      setCreatedKey(result.rawKey)
      setNewKeyName("")
      setNewKeyBudget("")
      setShowForm(false)
      await loadKeys()
    }
  }

  const handleDelete = async (id: string) => {
    await deleteVirtualKeyAction(id)
    await loadKeys()
  }

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Virtual Keys</h3>
        <button
          onClick={() => {
            if (!loaded) loadKeys()
            setShowForm(!showForm)
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Key
        </button>
      </div>

      {createdKey && (
        <div className="border-b border-border bg-green-500/10 px-4 py-3">
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            Key created! Copy it now — it won&apos;t be shown again:
          </p>
          <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs font-mono break-all">
            {createdKey}
          </code>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Key name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
            />
            <select
              value={newKeyProvider}
              onChange={(e) => setNewKeyProvider(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
              <option value="google">Google</option>
              <option value="nvidia">NVIDIA</option>
              <option value="groq">Groq</option>
              <option value="mistral">Mistral</option>
              <option value="together">Together</option>
              <option value="deepseek">DeepSeek</option>
              <option value="fireworks">Fireworks</option>
              <option value="perplexity">Perplexity</option>
              <option value="deepinfra">DeepInfra</option>
              <option value="anyscale">Anyscale</option>
              <option value="xai">xAI</option>
              <option value="opencode">OpenCode</option>
            </select>
            <input
              type="number"
              placeholder="Budget (USD, optional)"
              value={newKeyBudget}
              onChange={(e) => setNewKeyBudget(e.target.value)}
              className="w-40 rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
              min="0"
              step="0.01"
            />
            <button
              onClick={handleCreate}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {!loaded ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Click &quot;Create Key&quot; to get started.
          </p>
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No virtual keys yet. Create one to proxy requests through ATM.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Key</th>
                <th className="px-4 py-2 font-medium text-right">Budget</th>
                <th className="px-4 py-2 font-medium text-right">Used</th>
                <th className="px-4 py-2 font-medium">Last Used</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{k.provider}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      {visibleKeys.has(k.id) ? k.key_hash.slice(0, 16) + "..." : "••••••••"}
                      <button
                        onClick={() => toggleKeyVisibility(k.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {visibleKeys.has(k.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {k.budget_usd != null ? `$${k.budget_usd.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {k.budget_used_usd > 0 ? `$${k.budget_used_usd.toFixed(4)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatRelative(k.last_used_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        k.is_active
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {k.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(k.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
