import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function MasterCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Skeleton className="w-full h-52 rounded-none" />
      <div className="p-4 space-y-3 flex-1">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-9 w-full mt-auto rounded-md" />
      </div>
    </Card>
  )
}

export function MasterListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <MasterCardSkeleton key={i} />
      ))}
    </div>
  )
}
