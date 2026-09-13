import type { CSSProperties, ReactNode } from "react"
import { cn } from "../../lib/cn"

const PHOTO_OVERLAY =
  "linear-gradient(180deg, rgba(248, 251, 255, 0.22) 0%, rgba(15, 23, 42, 0.28) 42%, rgba(15, 23, 42, 0.62) 100%)"
const FALLBACK_SURFACE =
  "linear-gradient(135deg, #0f2747 0%, #1d4ed8 48%, #0b1f3a 100%)"
const FALLBACK_OVERLAY =
  "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(15, 23, 42, 0.28) 100%)"

export type SellerStoreMetric = {
  key: string
  icon: ReactNode
  value: string
  label: string
  detail?: string
}

type Props = {
  coverUrl: string | null | undefined
  identity: ReactNode
  actions?: ReactNode
  metrics?: SellerStoreMetric[]
  editControl?: ReactNode
  className?: string
}

function coverStyle(coverUrl: string | null | undefined): CSSProperties {
  const safe = coverUrl?.trim()
  if (!safe) {
    return {
      backgroundImage: `${FALLBACK_OVERLAY}, ${FALLBACK_SURFACE}`,
      backgroundPosition: "center, center",
      backgroundSize: "cover, cover",
    }
  }
  const escaped = safe.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  return {
    backgroundImage: `${PHOTO_OVERLAY}, url("${escaped}")`,
    backgroundPosition: "center, center",
    backgroundSize: "cover, cover",
  }
}

export function SellerStoreBanner({ coverUrl, identity, actions, metrics = [], editControl, className }: Props) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-t-2xl",
        "min-h-[180px] sm:min-h-[200px] lg:min-h-[240px]",
        className,
      )}
    >
      <div className="absolute inset-0" style={coverStyle(coverUrl)} aria-hidden="true" />
      <div className="relative z-10 flex min-h-[180px] min-w-0 flex-col justify-between gap-3 p-3 sm:min-h-[200px] sm:p-4 lg:min-h-[240px] lg:p-5">
        <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-start lg:gap-6">
          <div className="min-w-0 rounded-xl border border-white/25 bg-white/15 p-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/12">
            {identity}
          </div>
          {metrics.length > 0 ? (
            <ul
              className={cn(
                "grid min-w-0 overflow-hidden rounded-xl border border-white/25 bg-white/15 backdrop-blur-md supports-[backdrop-filter]:bg-white/[0.14]",
                metrics.length === 1 && "grid-cols-1",
                metrics.length === 2 && "grid-cols-2",
                metrics.length >= 3 && "grid-cols-3",
              )}
            >
              {metrics.map((metric) => (
                <li
                  key={metric.key}
                  className="min-w-0 border-white/20 px-1.5 py-2 text-center sm:px-2.5 [&:not(:first-child)]:border-l"
                >
                  <span className="mx-auto flex justify-center text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.8)]">
                    {metric.icon}
                  </span>
                  <p className="mt-1 truncate text-xl font-semibold text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.85)]">
                    {metric.value}
                  </p>
                  <p className="truncate text-meta text-white/90 drop-shadow-[0_1px_2px_rgba(15,23,42,0.75)]">{metric.label}</p>
                  {metric.detail ? (
                    <p className="truncate text-meta text-white/85 drop-shadow-[0_1px_2px_rgba(15,23,42,0.75)]">
                      {metric.detail}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {actions ? <div className="min-w-0">{actions}</div> : null}
      </div>
      {editControl ? <div className="absolute right-3 bottom-3 z-20 min-w-0">{editControl}</div> : null}
    </div>
  )
}
