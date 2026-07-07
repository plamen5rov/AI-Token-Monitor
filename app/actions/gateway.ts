"use server"

import crypto from "crypto"
import {
  createVirtualKey,
  deleteVirtualKey,
  getVirtualKeys,
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "@/lib/db"

export async function createVirtualKeyAction(
  name: string,
  provider: string,
  budgetUsd?: number
): Promise<{ id: string; rawKey: string } | null> {
  try {
    // Generate a random key
    const rawKey = `atm_${crypto.randomBytes(32).toString("hex")}`
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex")

    createVirtualKey({
      name,
      key_hash: keyHash,
      provider,
      is_active: 1,
      budget_usd: budgetUsd ?? null,
      budget_used_usd: 0,
      created_at: Date.now(),
      last_used_at: null,
    })

    return { id: "created", rawKey }
  } catch (error) {
    console.error("Failed to create virtual key:", error)
    return null
  }
}

export async function deleteVirtualKeyAction(id: string): Promise<boolean> {
  try {
    return deleteVirtualKey(id)
  } catch (error) {
    console.error("Failed to delete virtual key:", error)
    return false
  }
}

export async function getVirtualKeysAction() {
  try {
    return getVirtualKeys()
  } catch (error) {
    console.error("Failed to get virtual keys:", error)
    return []
  }
}

export async function createBudgetAction(
  scope: string,
  scopeId: string | undefined,
  limitUsd: number,
  period: string
): Promise<boolean> {
  try {
    createBudget({
      scope,
      scope_id: scopeId ?? null,
      limit_usd: limitUsd,
      period,
      used_usd: 0,
      created_at: Date.now(),
    })
    return true
  } catch (error) {
    console.error("Failed to create budget:", error)
    return false
  }
}

export async function deleteBudgetAction(id: string): Promise<boolean> {
  try {
    return deleteBudget(id)
  } catch (error) {
    console.error("Failed to delete budget:", error)
    return false
  }
}

export async function getBudgetsAction() {
  try {
    return getBudgets()
  } catch (error) {
    console.error("Failed to get budgets:", error)
    return []
  }
}

export async function resetBudgetUsageAction(id: string): Promise<boolean> {
  try {
    updateBudget(id, { used_usd: 0 })
    return true
  } catch (error) {
    console.error("Failed to reset budget:", error)
    return false
  }
}
