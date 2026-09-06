import { featuredListings } from "../../data/listings"
import { getPublicListings, isListingsReady } from "../../lib/listings"
import { isSupabaseConfigured } from "../../lib/supabase"
import { isListingPurchasable } from "../../lib/orders"
import { useListingsLive } from "../../lib/useListingsLive"
import { Container } from "../layout/Container"
import { ListingCard } from "../ui/ListingCard"
import { ViewAllLink } from "../ui/ViewAllLink"

export function FeaturedListings() {
  useListingsLive()
  if (!isListingsReady()) {
    return (
      <section id="browse" className="pb-14 sm:pb-16">
        <Container>
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Featured Motorcycles</h2>
          <p className="mt-4 text-sm text-navy-muted">Loading...</p>
        </Container>
      </section>
    )
  }
  const publicListings = getPublicListings().filter((listing) => isListingPurchasable(listing))
  const listings = isSupabaseConfigured()
    ? publicListings.slice(0, 5)
    : featuredListings.flatMap((listing) => {
        const live = publicListings.find((item) => item.id === listing.id)
        return live ? [live] : []
      })

  return (
    <section id="browse" className="pb-14 sm:pb-16">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Featured Motorcycles</h2>
          <ViewAllLink href="/browse">View all</ViewAllLink>
        </div>
        <div className="-mx-5 flex gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </Container>
    </section>
  )
}
