import type { ReactNode } from "react"
import { ViewAllLink } from "../ui/ViewAllLink"

export function HomeSectionHeader({
  title,
  icon,
  trailing,
}: {
  title: string
  icon?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="flex items-center gap-1.5 text-section font-semibold text-navy">
          {icon}
          {title}
        </h2>
        {trailing}
      </div>
      <ViewAllLink href="/browse" className="text-ui">
        Lihat Semua
      </ViewAllLink>
    </div>
  )
}
