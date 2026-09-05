import { Search } from "lucide-react"
import type { FormEvent } from "react"

type Props = {
  className?: string
}

export function SearchBar({ className }: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={className}>
      <label htmlFor="motorcycle-search" className="sr-only">
        Search motorcycles
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-muted"
          aria-hidden="true"
        />
        <input
          id="motorcycle-search"
          name="q"
          type="search"
          placeholder="Search motorcycles..."
          className="h-10 w-full rounded-full border border-transparent bg-surface pl-10 pr-4 text-sm text-navy placeholder:text-navy-muted/80 focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </form>
  )
}
