import type { AnchorHTMLAttributes, ReactNode } from "react"
import { cn } from "../../lib/cn"

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode
}

export function TextLink({ children, className, ...props }: Props) {
  return (
    <a
      className={cn(
        "text-sm text-navy transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  )
}
