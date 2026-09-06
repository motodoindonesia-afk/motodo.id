import type { SVGProps } from "react"
import { cn } from "../../lib/cn"

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 5.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function MotorcyclePaths() {
  return (
    <g {...stroke}>
      <path d="M5 24a10.5 10.5 0 0 1 21 0" />
      <path d="M50 33a13 13 0 1 1 25 0" />
      <path d="M11 22c4.5-11 17-15 30-10 7 2.8 12 7.5 15.5 12.5" />
      <path d="M54 8h20" />
    </g>
  )
}

/** Minimalist retro motorcycle mark. viewBox 88×42. */
export function MotodoMark({
  className,
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 88 42"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <MotorcyclePaths />
    </svg>
  )
}

/** Stacked Motodo logo: motorcycle icon above lowercase wordmark. viewBox 108×60. */
export function MotodoLogo({
  className,
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 108 60"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <g transform="translate(10 1)">
        <MotorcyclePaths />
      </g>
      <text
        x="54"
        y="57"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="15.5"
        fontWeight="800"
        letterSpacing="-0.04em"
      >
        motodo
      </text>
    </svg>
  )
}

export function MotodoLogoLockup({
  className,
  stackedClassName,
}: {
  className?: string
  markClassName?: string
  stackedClassName?: string
}) {
  return (
    <span className={cn("inline-flex text-brand", className)}>
      <MotodoLogo className={stackedClassName ?? "h-[52px] w-[108px]"} />
    </span>
  )
}
