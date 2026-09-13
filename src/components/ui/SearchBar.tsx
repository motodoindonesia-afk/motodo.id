import { Search } from "lucide-react"
import type { FormEvent } from "react"
import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

type Props = {
  className?: string
  id?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  onChange?: (value: string) => void
  onSubmitSearch?: (value: string) => void
  size?: "sm" | "md" | "lg"
  variant?: "pill" | "market"
  compact?: boolean
}

export function SearchBar({
  className,
  id = "motorcycle-search",
  value,
  defaultValue,
  placeholder,
  onChange,
  onSubmitSearch,
  size = "md",
  variant = "pill",
  compact = false,
}: Props) {
  const t = useT()
  const resolvedPlaceholder = placeholder ?? t("browse.searchDefault")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = String(formData.get("q") ?? "")
    onSubmitSearch?.(query)
  }

  const market = variant === "market"

  return (
    <form onSubmit={handleSubmit} role="search" className={cn("min-w-0 w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {t("nav.searchAria")}
      </label>
      <div
        className={cn(
          "relative min-w-0",
          market &&
            cn(
              "flex w-full overflow-hidden border border-line bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
              compact ? "rounded-lg" : "rounded-xl",
            ),
        )}
      >
        {market ? null : (
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-muted"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          name="q"
          type="search"
          placeholder={resolvedPlaceholder}

          {...(value !== undefined ? { value } : { defaultValue })}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            "w-full min-w-0 text-navy placeholder:text-navy-muted/80 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
            market
              ? cn(
                  "min-w-0 w-full flex-1 border-0 bg-transparent px-3 focus:ring-0",
                  "h-10 text-ui",
                )
              : cn(
                  "rounded-full border border-transparent bg-surface pl-10 pr-4 focus:border-brand/30 focus:ring-2 focus:ring-brand/20",
                  size === "lg" ? "h-12 text-sm" : size === "sm" ? "h-9 text-ui" : "h-10 text-sm",
                ),
          )}
        />
        {market ? (
          <button
            type="submit"
            className={cn(
              "flex shrink-0 items-center justify-center bg-brand text-white hover:bg-brand-hover",
              compact ? "h-10 w-10" : "w-10",
            )}
            aria-label={t("common.search")}
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </form>
  )
}
