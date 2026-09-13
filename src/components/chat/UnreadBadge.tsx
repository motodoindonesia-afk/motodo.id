export function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count < 1) return null
  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-meta font-semibold leading-none text-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}
