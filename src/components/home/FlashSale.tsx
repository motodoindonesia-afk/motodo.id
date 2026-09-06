import { Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { coerceListingQuantity } from "../../lib/listingForm"
import { useListingsLive } from "../../lib/useListingsLive"
import { Container } from "../layout/Container"
import { ListingCard } from "../ui/ListingCard"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { getPublicHomeListings } from "./homeListings"

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
    <span className="inline-flex min-w-[1.75rem] justify-center rounded-sm bg-navy px-1 py-0.5 text-[11px] font-medium tabular-nums text-white">
      {value}
    </span>
  )
}

export function FlashSale() {
  useListingsLive()
  const countdown = useEndOfDayCountdown()
  const listings = getPublicHomeListings()

  return (
    <section className="pb-6">
      <Container>
        <HomeSectionHeader
          title="Flash Sale"
          icon={<Zap className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />}
          trailing={
            <span className="flex items-center gap-1" aria-label="Countdown">
              <CountdownBox value={countdown.hours} />
              <span className="text-meta text-navy-muted">:</span>
              <CountdownBox value={countdown.minutes} />
              <span className="text-meta text-navy-muted">:</span>
              <CountdownBox value={countdown.seconds} />
            </span>
          }
        />
        {listings === null ? (
          <p className="text-ui text-navy-muted">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="text-ui text-navy-muted">Belum ada motor untuk ditampilkan.</p>
        ) : (
          <div className="-mx-5 flex min-w-0 items-stretch gap-3 overflow-x-auto px-5 pb-1">
            {listings.slice(0, 6).map((listing) => {
              const remaining = coerceListingQuantity(listing.quantity)
              const fill = remaining <= 0 ? 0 : Math.min(100, Math.max(16, remaining * 20))
              return (
                <div key={listing.id} className="w-[168px] shrink-0 self-stretch sm:w-[180px]">
                  <ListingCard
                    listing={listing}
                    badge={
                      <span className="rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-medium text-white">Promo</span>
                    }
                    hideQuantity
                    footer={
                      <div>
                        <div className="h-1 overflow-hidden rounded-full bg-brand-soft">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${fill}%` }} />
                        </div>
                        <p className="mt-1 min-h-[1.4em] text-meta text-navy-muted">Tersisa {remaining}</p>
                      </div>
                    }
                  />
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </section>
  )
}
