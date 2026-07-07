"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  createBudgetAction,
  deleteBudgetAction,
  getBudgetsAction,
  resetBudgetUsageAction,
} from "@/app/actions/gateway"
import type { Budget } from "@/types"

export function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newScope, setNewScope] = useState("global")
  const [newScopeId, setNewScopeId] = useState("")
  const [newLimit, setNewLimit] = useState("")
  const [newPeriod, setNewPeriod] = useState("daily")

  const loadBudgets = async () => {
    const result = await getBudgetsAction()
    setBudgets(result)
    setLoaded(true)
  }

  const handleCreate = async () => {
    if (!newLimit || parseFloat(newLimit) <= 0) return
    await createBudgetAction(
      newScope,
      newScope === "global" ? undefined : newScopeId || undefined,
      parseFloat(newLimit),
      newPeriod
    )
    setNewLimit("")
    setNewScopeId("")
    setShowForm(false)
    await loadBudgets()
  }

  const handleDelete = async (id: string) => {
    await deleteBudgetAction(id)
    await loadBudgets()
  }

  const handleReset = async (id: string) => {
    await resetBudgetUsageAction(id)
    await loadBudgets()
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Budgets</h3>
        <button
          onClick={() => {
            if (!loaded) loadBudgets()
            setShowForm(!showForm)
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Budget
        </button>
      </div>

      {showForm && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
            >
              <option value="global">Global</option>
              <option value="provider">Provider</option>
              <option value="model">Model</option>
            </select>
            {newScope !== "global" && (
              <input
                type="text"
                placeholder={newScope === "provider" ? "Provider name" : "Model name"}
                value={newScopeId}
                onChange={(e) => setNewScopeId(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
              />
            )}
            <input
              type="number"
              placeholder="Limit (USD)"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
              min="0"
              step="0.01"
            />
            <select
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="total">Total</option>
            </select>
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
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Click &quot;Add Budget&quot; to set spending limits.
          </p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No budgets set. Requests will flow through without limits.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Scope</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium text-right">Limit</th>
                <th className="px-4 py-2 font-medium text-right">Used</th>
                <th className="px-4 py-2 font-medium text-right">Remaining</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => {
                const remaining = b.limit_usd - b.used_usd
                const pct = b.limit_usd > 0 ? (b.used_usd / b.limit_usd) * 100 : 0
                return (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium capitalize">{b.scope}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.scope_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {b.period}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${b.limit_usd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      ${b.used_usd.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={remaining < 0 ? "text-red-500" : ""}>
                        ${remaining.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 100
                                ? "bg-red-500"
                                : pct >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleReset(b.id)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Reset usage"
                        >
                          ↺
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
