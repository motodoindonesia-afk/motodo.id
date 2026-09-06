import { Sparkles } from "lucide-react"
import { useListingsLive } from "../../lib/useListingsLive"
import { Container } from "../layout/Container"
import { ListingCard } from "../ui/ListingCard"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { getPublicHomeListings } from "./homeListings"

export function FeaturedListings() {
  useListingsLive()
  const listings = getPublicHomeListings()

  if (listings === null) {
    return (
      <section id="browse" className="pb-8">
        <Container>
          <HomeSectionHeader
            title="Rekomendasi"
            icon={<Sparkles className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />}
          />
          <p className="text-ui text-navy-muted">Loading...</p>
        </Container>
      </section>
    )
  }

  return (
    <section id="browse" className="pb-8">
      <Container>
        <HomeSectionHeader
          title="Rekomendasi"
          icon={<Sparkles className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />}
        />
        {listings.length === 0 ? (
          <p className="text-ui text-navy-muted">Belum ada motor untuk ditampilkan.</p>
        ) : (
          <div className="-mx-5 flex items-stretch gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5">
            {listings.slice(0, 5).map((listing) => (
              <div key={listing.id} className="h-full min-w-[168px] sm:min-w-0">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
