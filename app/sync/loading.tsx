import { TableSkeleton } from "@/components/skeletons"

export default function SyncLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-20 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-4 w-64 rounded bg-muted/60 animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
