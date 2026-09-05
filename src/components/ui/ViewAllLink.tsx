import { ArrowRight } from "lucide-react"
import { cn } from "../../lib/cn"

type Props = {
  href: string
  children: string
  className?: string
}

export function ViewAllLink({ href, children, className }: Props) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </a>
  )
}
