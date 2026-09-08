import { cn } from "../../lib/cn"
import { nameInitials } from "../../lib/profile"

type Size = "sm" | "md" | "lg" | "hero"

const SIZE: Record<Size, string> = {
  sm: "size-7 text-[11px]",
  md: "size-12 text-sm",
  lg: "size-[120px] text-3xl",
  hero: "size-20 text-xl min-[769px]:size-[88px] min-[769px]:text-2xl",
}

export function UserAvatar({
  name,
  size = "md",
  className,
}: {
  name: string
  size?: Size
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand",
        SIZE[size],
        className,
      )}
      aria-hidden="true"
    >
      {nameInitials(name)}
    </span>
  )
}
