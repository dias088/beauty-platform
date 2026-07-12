/**
 * Скелетон карточки мастера в форме реальной карточки. Мягкая пульсация
 * прозрачности (animate-pulse), без мигания. Отключается при reduced-motion
 * средствами Tailwind (motion-reduce:animate-none).
 */
function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.06] motion-reduce:animate-none ${className}`}
    />
  )
}

export function MasterCardSkeleton() {
  return (
    <div className="surface flex h-full flex-col overflow-hidden rounded-[18px]">
      <div className="h-48 w-full animate-pulse bg-white/[0.05] motion-reduce:animate-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Bar className="h-4 w-1/2" />
          <Bar className="h-4 w-10" />
        </div>
        <div className="flex gap-1.5">
          <Bar className="h-5 w-16 rounded-full" />
          <Bar className="h-5 w-16 rounded-full" />
        </div>
        <Bar className="h-4 w-2/3" />
        <Bar className="mt-auto h-9 w-full rounded-[12px]" />
      </div>
    </div>
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
