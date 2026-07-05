"use server"

import { setSetting } from "@/lib/db"

export async function saveSettingsAction(input: {
  refreshInterval: string
  currency: string
}): Promise<{ success: boolean; message: string }> {
  const intervalNum = Number(input.refreshInterval)
  if (!Number.isFinite(intervalNum) || intervalNum < 0 || intervalNum > 1440) {
    return {
      success: false,
      message: "Refresh interval must be a number between 0 and 1440 minutes.",
    }
  }
  if (!["USD", "EUR", "GBP"].includes(input.currency)) {
    return { success: false, message: "Currency must be USD, EUR, or GBP." }
  }

  setSetting("refresh_interval", String(Math.round(intervalNum)))
  setSetting("currency", input.currency)
  return { success: true, message: "Settings saved." }
}