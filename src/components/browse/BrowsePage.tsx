import { SlidersHorizontal, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  emptyBrowseFilters,
  filterListings,
  formatMotorcycleCount,
  hasActiveFilters,
  paginateListings,
  sortListings,
} from "../../lib/browse"
import { getPublicListings } from "../../lib/listings"
import { useListingsLive } from "../../lib/useListingsLive"
import { SORT_OPTIONS, MOTORCYCLE_CATEGORIES, type BrowseFilters, type MotorcycleCategory, type SortOption } from "../../types/marketplace"
import { Container } from "../layout/Container"
import { Button } from "../ui/Button"
import { MotorcycleCard } from "../ui/MotorcycleCard"
import { SearchBar } from "../ui/SearchBar"
import { FilterSidebar } from "./FilterSidebar"
import { Pagination } from "./Pagination"

function parseCategoryParam(value: string | null): MotorcycleCategory | null {
  if (!value) return null
  return (MOTORCYCLE_CATEGORIES as readonly string[]).includes(value) ? (value as MotorcycleCategory) : null
}

export function BrowsePage() {
  const listingVersion = useListingsLive()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<BrowseFilters>({
    ...emptyBrowseFilters,
    query: searchParams.get("q") ?? "",
    categories: (() => {
      const category = parseCategoryParam(searchParams.get("category"))
      return category ? [category] : []
    })(),
  })
  const [sort, setSort] = useState<SortOption>("newest")
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const query = searchParams.get("q") ?? ""
    const category = parseCategoryParam(searchParams.get("category"))
    setFilters((current) => ({
      ...current,
      query,
      categories: category ? [category] : current.categories,
    }))
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [filtersOpen])

  const filtered = useMemo(
    () => sortListings(filterListings(getPublicListings(), filters), sort),
    [filters, sort, listingVersion],
  )
  const paged = paginateListings(filtered, page)

  function updateFilters(next: BrowseFilters) {
    setFilters(next)
    setPage(1)
  }

  function clearFilters() {
    updateFilters(emptyBrowseFilters)
    setFiltersOpen(false)
  }

  return (
    <main className="bg-white pb-10 sm:pb-12">
      <Container className="pt-6 sm:pt-8">
        <div className="max-w-2xl">
          <h1 className="text-page font-bold tracking-tight text-navy sm:text-[1.5rem]">
            Browse Motorcycles
          </h1>
          <p className="mt-1.5 text-ui leading-relaxed text-navy-muted">
            Find your next custom & premium motorcycle.
          </p>
        </div>

        <div className="mt-4">
          <SearchBar
            id="browse-search"
            className="max-w-2xl"
            size="sm"
            value={filters.query}
            onChange={(query) => updateFilters({ ...filters, query })}
          />
        </div>

        <div className="mt-5 lg:mt-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <div className="hidden lg:block">
            <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
          </div>

          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-3">
                <p className="text-ui font-medium text-navy">
                  {formatMotorcycleCount(filtered.length)}
                </p>
                <Button
                  variant="secondary"
                  className="lg:hidden"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Filters
                </Button>
              </div>
              <label className="flex items-center gap-2 text-ui text-navy-muted">
                <span className="shrink-0">Sort</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortOption)
                    setPage(1)
                  }}
                  className="h-9 min-w-[180px] rounded-lg border border-transparent bg-surface px-3 text-ui text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {paged.total === 0 ? (
              <div className="rounded-xl bg-surface px-5 py-10 text-center">
                <h2 className="text-section font-bold text-navy">No motorcycles found</h2>
                <p className="mt-1.5 text-ui text-navy-muted">
                  Try adjusting your search or filters.
                </p>
                {hasActiveFilters(filters) ? (
                  <Button className="mt-6" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {paged.items.map((listing) => (
                    <MotorcycleCard
                      key={listing.id}
                      listing={listing}
                      href={`/motorcycles/${listing.id}`}
                      showCategory
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={paged.currentPage}
                  totalPages={paged.totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      </Container>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-navy/30"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,320px)] flex-col bg-white px-5 py-6 shadow-none">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-base font-bold text-navy">Filters</p>
              <button
                type="button"
                className="rounded-lg p-1.5 text-navy"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1">
              <FilterSidebar
                filters={filters}
                onChange={updateFilters}
                onClear={clearFilters}
                showHeading={false}
                idPrefix="mobile-"
              />
            </div>
            <Button className="mt-6" onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
