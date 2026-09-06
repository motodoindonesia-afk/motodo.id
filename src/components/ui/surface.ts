import { cn } from "../../lib/cn"

/** White marketplace card on the Motodo page gradient. */
export const surfaceCardClass =
  "rounded-2xl border border-line bg-white shadow-card"

export function surfaceCard(...classNames: Array<string | false | null | undefined>) {
  return cn(surfaceCardClass, ...classNames)
}
