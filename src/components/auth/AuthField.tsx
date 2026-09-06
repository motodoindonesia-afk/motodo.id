import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"
import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  leading?: ReactNode
}

export function AuthInput({ className, invalid, leading, ...props }: Props) {
  const input = (
    <input
      className={cn(
        "h-11 w-full rounded-lg border bg-white px-3 text-sm text-navy placeholder:text-navy-muted/80 focus:outline-none focus:ring-2 focus:ring-brand/20",
        leading ? "pl-10" : null,
        invalid ? "border-red-300 focus:border-red-400" : "border-line focus:border-brand/30",
        className,
      )}
      {...props}
    />
  )
  if (!leading) return input
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted" aria-hidden="true">
        {leading}
      </span>
      {input}
    </div>
  )
}

export function AuthTextarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-navy placeholder:text-navy-muted/80 focus:outline-none focus:ring-2 focus:ring-brand/20",
        invalid ? "border-red-300 focus:border-red-400" : "border-line focus:border-brand/30",
        className,
      )}
      {...props}
    />
  )
}

export function AuthSelect({
  className,
  invalid,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border bg-white px-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand/20",
        invalid ? "border-red-300 focus:border-red-400" : "border-line focus:border-brand/30",
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
}) {
  const t = useT()
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
        {optional ? <span className="font-normal text-navy-muted"> {t("common.optional")}</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-navy-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
