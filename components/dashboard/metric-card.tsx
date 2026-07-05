import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type MetricCardProps = {
  title: string
  value: string
  hint?: string
  icon?: LucideIcon
  className?: string
}

export function MetricCard({ title, value, hint, icon: Icon, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 transition-colors hover:border-muted-foreground/30",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon ? (
          <Icon className="h-4 w-4 text-muted-foreground/60" />
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
