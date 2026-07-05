export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
      </div>
      <div className="mt-3 h-7 w-32 rounded bg-muted animate-pulse" />
      <div className="mt-2 h-3 w-40 rounded bg-muted/60 animate-pulse" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-6 w-20 rounded bg-muted animate-pulse" />
      </div>
      <div className="mt-4 h-[200px] w-full rounded bg-muted/40 animate-pulse" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-32 rounded bg-muted animate-pulse" />
        <div className="mt-2 h-4 w-64 rounded bg-muted/60 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TableSkeleton rows={4} />
        <TableSkeleton rows={5} />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
