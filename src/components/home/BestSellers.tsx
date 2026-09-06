import { Flame } from "lucide-react"
import { useListingsLive } from "../../lib/useListingsLive"
import { Container } from "../layout/Container"
import { ListingCard } from "../ui/ListingCard"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { getPublicHomeListings } from "./homeListings"

export function BestSellers() {
  useListingsLive()
  const listings = getPublicHomeListings()

  return (
    <section className="pb-6">
      <Container>
        <HomeSectionHeader
          title="Produk Terlaris"
          icon={<Flame className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />}
        />
        {listings === null ? (
          <p className="text-ui text-navy-muted">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="text-ui text-navy-muted">Belum ada motor untuk ditampilkan.</p>
        ) : (
          <div className="-mx-5 flex min-w-0 items-stretch gap-3 overflow-x-auto px-5 pb-1">
            {listings.slice(0, 6).map((listing, index) => (
              <div key={listing.id} className="w-[168px] shrink-0 self-stretch sm:w-[180px]">
                <ListingCard
                  listing={listing}
                  badge={
                    <span className="rounded-sm bg-navy px-1.5 py-0.5 text-[10px] font-medium text-white">
                      TOP {index + 1}
                    </span>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
