import type { AnchorHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode
}

export function TextLink({ children, className, href = "", onClick, ...props }: Props) {
  const classes = cn(
    "text-sm text-navy transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    className,
  )

  if (href.startsWith("/")) {
    return (
      <Link to={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={classes} onClick={onClick} {...props}>
      {children}
    </a>
  )
}
