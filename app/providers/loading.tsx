export default function ProvidersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-4 w-72 rounded bg-muted/60 animate-pulse" />
        </div>
        <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-32 rounded bg-muted animate-pulse" />
              <div className="h-5 w-16 rounded bg-muted animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-16 rounded-lg bg-muted animate-pulse" />
              <div className="h-7 w-7 rounded-lg bg-muted animate-pulse" />
              <div className="h-7 w-7 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
