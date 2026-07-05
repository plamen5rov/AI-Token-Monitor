"use server"

import {
  createProvider,
  deleteProvider,
  getProviderById,
  getProviders,
  updateProvider,
} from "@/lib/db"
import { encrypt } from "@/lib/crypto"
import { healthCheckProvider, syncProvider, type SyncResult } from "@/lib/sync"
import { getTemplate, PROVIDER_TEMPLATES } from "@/templates"

export type AddProviderResult = {
  success: boolean
  message: string
  providerId?: string
}

export async function addProviderAction(
  type: string,
  name: string,
  apiKey: string
): Promise<AddProviderResult> {
  const template = getTemplate(type)
  if (!template) {
    return { success: false, message: `Unknown provider type: ${type}` }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { success: false, message: "Provider name is required." }
  }

  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    return { success: false, message: "API key is required." }
  }

  const provider = createProvider({
    name: trimmedName,
    type,
    api_key_encrypted: encrypt(trimmedKey),
    is_active: 1,
    created_at: Date.now(),
    last_sync: null,
  })

  return {
    success: true,
    message: `${template.displayName} provider "${trimmedName}" added successfully.`,
    providerId: provider.id,
  }
}

export async function deleteProviderAction(
  providerId: string
): Promise<{ success: boolean; message: string }> {
  const provider = getProviderById(providerId)
  if (!provider) {
    return { success: false, message: "Provider not found." }
  }

  const deleted = deleteProvider(providerId)
  return {
    success: deleted,
    message: deleted
      ? `Provider "${provider.name}" deleted.`
      : "Failed to delete provider.",
  }
}

export async function toggleProviderAction(
  providerId: string
): Promise<{ success: boolean; message: string; isActive: boolean }> {
  const provider = getProviderById(providerId)
  if (!provider) {
    return { success: false, message: "Provider not found.", isActive: false }
  }

  const nextActive = provider.is_active === 1 ? 0 : 1
  updateProvider(providerId, { is_active: nextActive })
  return {
    success: true,
    message:
      nextActive === 1
        ? `Provider "${provider.name}" enabled.`
        : `Provider "${provider.name}" disabled.`,
    isActive: nextActive === 1,
  }
}

export async function healthCheckAction(
  providerId: string
): Promise<{ success: boolean; message: string; healthy: boolean }> {
  const provider = getProviderById(providerId)
  if (!provider) {
    return { success: false, message: "Provider not found.", healthy: false }
  }

  const healthy = await healthCheckProvider(provider)
  const template = getTemplate(provider.type)
  return {
    success: true,
    healthy,
    message: healthy
      ? `${template?.displayName ?? provider.name}: connection healthy.`
      : `${template?.displayName ?? provider.name}: health check failed. Check API key.`,
  }
}

export async function syncProviderFromProvidersAction(
  providerId: string
): Promise<{ result: SyncResult; message: string }> {
  const provider = getProviderById(providerId)
  if (!provider) {
    return {
      result: {
        providerId,
        status: "error",
        modelsSynced: 0,
        recordsSynced: 0,
        error: "Provider not found",
      },
      message: "Provider not found.",
    }
  }

  const result = await syncProvider(provider)
  return {
    result,
    message:
      result.status === "success"
        ? `Synced ${result.modelsSynced} models, ${result.recordsSynced} records.`
        : `Sync failed: ${result.error}`,
  }
}

export async function getTemplatesForUI() {
  return PROVIDER_TEMPLATES.map((t) => ({
    type: t.type,
    displayName: t.displayName,
    description: t.description,
    apiKeyLabel: t.apiKeyLabel,
    apiKeyPrefix: t.apiKeyPrefix,
    apiKeyHelpUrl: t.apiKeyHelpUrl,
  }))
}

export async function getProvidersForUI() {
  return getProviders()
}
