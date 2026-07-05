export function formatCurrency(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}k`
    }
  }
  return `$${value.toFixed(2)}`
}

export function formatNumber(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k`
    }
  }
  return value.toLocaleString("en-US")
}

export function formatTimestamp(ms: number | null): string {
  if (!ms) return "—"
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRelative(ms: number | null): string {
  if (!ms) return "—"
  const diff = Date.now() - ms
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
