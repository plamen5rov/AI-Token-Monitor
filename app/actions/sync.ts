"use server"

import { getProviders } from "@/lib/db"
import { syncProvider, syncAllProviders, type SyncResult } from "@/lib/sync"

export async function syncAllAction(): Promise<{ results: SyncResult[]; message: string }> {
  const results = await syncAllProviders()
  const success = results.filter((r) => r.status === "success").length
  const errors = results.filter((r) => r.status === "error").length

  if (results.length === 0) {
    return { results, message: "No active providers to sync." }
  }

  const parts: string[] = []
  if (success) parts.push(`${success} synced`)
  if (errors) parts.push(`${errors} failed`)
  return {
    results,
    message: errors === 0 ? `Synced ${success} provider(s).` : `Synced ${success}, ${errors} failed.`,
  }
}

export async function syncProviderAction(providerId: string): Promise<{ result: SyncResult; message: string }> {
  const providers = getProviders().filter((p) => p.id === providerId)
  if (providers.length === 0) {
    return {
      result: { providerId, status: "error", modelsSynced: 0, recordsSynced: 0, error: "Provider not found" },
      message: "Provider not found.",
    }
  }

  const result = await syncProvider(providers[0])
  return {
    result,
    message: result.status === "success"
      ? `Synced ${result.modelsSynced} models, ${result.recordsSynced} records.`
      : `Sync failed: ${result.error}`,
  }
}