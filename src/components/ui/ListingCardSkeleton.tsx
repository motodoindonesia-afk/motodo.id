export function ListingCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card max-[769px]:rounded-xl" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-surface max-[769px]:aspect-auto max-[769px]:h-[160px]" />
      <div className="space-y-2 px-3 py-2.5">
        <div className="h-4 w-[88%] animate-pulse rounded bg-surface" />
        <div className="h-4 w-[42%] animate-pulse rounded bg-brand-soft" />
        <div className="h-3 w-[64%] animate-pulse rounded bg-surface" />
      </div>
    </div>
  )
}
