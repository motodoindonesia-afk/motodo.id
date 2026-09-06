import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function pageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
}

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const t = useT()
  if (totalPages <= 1) return null

  const pages = pageItems(currentPage, totalPages)

  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label={t("browse.pagination")}>
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg px-2.5 py-1.5 text-ui font-medium text-navy hover:text-brand disabled:cursor-not-allowed disabled:text-navy-muted/50"
      >
        {t("pagination.previous")}
      </button>
      {pages.map((page, index) => {
        const previous = pages[index - 1]
        return (
          <span key={page} className="contents">
            {previous && page - previous > 1 ? (
              <span className="px-1 text-sm text-navy-muted" aria-hidden="true">
                ...
              </span>
            ) : null}
            <button
              type="button"
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
              className={cn(
                "min-w-8 rounded-lg px-2.5 py-1.5 text-ui font-medium",
                page === currentPage
                  ? "bg-brand text-white"
                  : "text-navy hover:bg-surface",
              )}
            >
              {page}
            </button>
          </span>
        )
      })}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg px-2.5 py-1.5 text-ui font-medium text-navy hover:text-brand disabled:cursor-not-allowed disabled:text-navy-muted/50"
      >
        {t("pagination.next")}
      </button>
    </nav>
  )
}
