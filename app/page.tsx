function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Track your AI usage and costs across providers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Cost" value="$0.00" />
        <MetricCard title="Tokens Used" value="0" />
        <MetricCard title="Active Providers" value="0" />
        <MetricCard title="Requests Today" value="0" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Usage over time
        </h3>
        <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          Chart placeholder
        </div>
      </div>
    </div>
  )
}
