import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"

type Props = {
  href: string
  children: string
  className?: string
}

export function ViewAllLink({ href, children, className }: Props) {
  const classes = cn(
    "inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    className,
  )

  const content = (
    <>
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </>
  )

  if (href.startsWith("/")) {
    return (
      <Link to={href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <a href={href} className={classes}>
      {content}
    </a>
  )
}
