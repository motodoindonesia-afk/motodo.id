import type { ReactNode } from "react"

export const HOME_PRODUCT_COUNT = 6

/** Shared homepage product grid. Cards fill the Motodo container; the grid sets column count. */
export const homeProductGridClass =
  "grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 desk:grid-cols-6 md:gap-4"

export function HomeProductGrid({ children }: { children: ReactNode }) {
  return <div className={homeProductGridClass}>{children}</div>
}

export function HomeProductCell({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>
}
