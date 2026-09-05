import { Search } from "lucide-react"
import type { FormEvent } from "react"
import { cn } from "../../lib/cn"

type Props = {
  className?: string
  id?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSubmitSearch?: (value: string) => void
  size?: "md" | "lg"
}

export function SearchBar({
  className,
  id = "motorcycle-search",
  value,
  defaultValue,
  onChange,
  onSubmitSearch,
  size = "md",
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = String(formData.get("q") ?? "")
    onSubmitSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Search motorcycles
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-muted"
          aria-hidden="true"
        />
        <input
          id={id}
          name="q"
          type="search"
          placeholder="Search motorcycles..."
          {...(value !== undefined ? { value } : { defaultValue })}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            "w-full rounded-full border border-transparent bg-surface pl-10 pr-4 text-sm text-navy placeholder:text-navy-muted/80 focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20",
            size === "lg" ? "h-12" : "h-10",
          )}
        />
      </div>
    </form>
  )
}
