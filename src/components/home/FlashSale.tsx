import { Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { coerceListingQuantity } from "../../lib/listingForm"
import { useListingsLive } from "../../lib/useListingsLive"
import { Container } from "../layout/Container"
import { ListingCard } from "../ui/ListingCard"
import { ListingCardSkeleton } from "../ui/ListingCardSkeleton"
import { EmptyState } from "../ui/EmptyState"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { HOME_PRODUCT_COUNT, HomeProductCell, HomeProductGrid } from "./HomeProductGrid"
import { getPublicHomeListings } from "./homeListings"
import { useT } from "../../i18n"

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function msUntilEndOfLocalDay() {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return Math.max(0, end.getTime() - Date.now())
}

function useEndOfDayCountdown() {
  const [remaining, setRemaining] = useState(msUntilEndOfLocalDay)

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(msUntilEndOfLocalDay()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const total = Math.floor(remaining / 1000)
  return {
    hours: pad(Math.floor(total / 3600)),
    minutes: pad(Math.floor((total % 3600) / 60)),
    seconds: pad(total % 60),
  }
}

function CountdownBox({ value }: { value: string }) {
  return (
    <span className="inline-flex min-w-[1.75rem] justify-center rounded-sm bg-navy px-1 py-0.5 text-meta font-medium tabular-nums text-white">
      {value}
    </span>
  )
}

export function FlashSale() {
  useListingsLive()
  const countdown = useEndOfDayCountdown()
  const listings = getPublicHomeListings()
  const t = useT()

  return (
    <section className="pb-6">
      <Container>
        <HomeSectionHeader
          title={t("home.flashSale")}
          icon={<Zap className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />}
          trailing={
            <span className="flex items-center gap-1" aria-label={t("home.countdown")}>
              <CountdownBox value={countdown.hours} />
              <span className="text-meta text-navy-muted">:</span>
              <CountdownBox value={countdown.minutes} />
              <span className="text-meta text-navy-muted">:</span>
              <CountdownBox value={countdown.seconds} />
            </span>
          }
        />
        {listings === null ? (
          <HomeProductGrid>
            {Array.from({ length: HOME_PRODUCT_COUNT }).map((_, index) => (
              <HomeProductCell key={index}>
                <ListingCardSkeleton />
              </HomeProductCell>
            ))}
          </HomeProductGrid>
        ) : listings.length === 0 ? (
          <EmptyState title={t("home.emptyListings")} />
        ) : (
          <HomeProductGrid>
            {listings.slice(0, HOME_PRODUCT_COUNT).map((listing) => {
              const remaining = coerceListingQuantity(listing.quantity)
              const fill = remaining <= 0 ? 0 : Math.min(100, Math.max(16, remaining * 20))
              return (
                <HomeProductCell key={listing.id}>
                  <ListingCard
                    listing={listing}
                    badge={
                      <span className="rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-medium text-white">{t("home.promo")}</span>
                    }
                    hideQuantity
                    footer={
                      <div>
                        <div className="h-1 overflow-hidden rounded-full bg-brand-soft">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${fill}%` }} />
                        </div>
                        <p className="mt-1 min-h-[1.4em] text-meta text-navy-muted">{t("home.remaining", { count: remaining })}</p>
                      </div>
                    }
                  />
                </HomeProductCell>
              )
            })}
          </HomeProductGrid>
        )}
      </Container>
    </section>
  )
}
