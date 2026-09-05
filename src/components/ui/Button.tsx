import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "../../lib/cn"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: "primary" | "text" | "secondary"
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        variant === "primary" &&
          "bg-brand px-4 py-2.5 text-white hover:bg-brand-hover",
        variant === "text" && "text-navy hover:text-brand",
        variant === "secondary" &&
          "border border-line bg-white px-4 py-2.5 text-navy hover:bg-surface",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
