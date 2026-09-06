import { Sparkles } from "lucide-react"
import { useListingsLive } from "../../lib/useListingsLive"
import { Container } from "../layout/Container"
import { ListingCard } from "../ui/ListingCard"
import { ListingCardSkeleton } from "../ui/ListingCardSkeleton"
import { EmptyState } from "../ui/EmptyState"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { HOME_PRODUCT_COUNT, HomeProductCell, HomeProductGrid } from "./HomeProductGrid"
import { getPublicHomeListings } from "./homeListings"
import { useT } from "../../i18n"

function FeaturedBody({
  listings,
}: {
  listings: ReturnType<typeof getPublicHomeListings>
}) {
  const t = useT()

  if (listings === null) {
    return (
      <HomeProductGrid>
        {Array.from({ length: HOME_PRODUCT_COUNT }).map((_, index) => (
          <HomeProductCell key={index}>
            <ListingCardSkeleton />
          </HomeProductCell>
        ))}
      </HomeProductGrid>
    )
  }

  if (listings.length === 0) {
    return <EmptyState title={t("home.emptyListings")} />
  }

  return (
    <HomeProductGrid>
      {listings.slice(0, HOME_PRODUCT_COUNT).map((listing) => (
        <HomeProductCell key={listing.id}>
          <ListingCard listing={listing} />
        </HomeProductCell>
      ))}
    </HomeProductGrid>
  )
}

export function FeaturedListings() {
  useListingsLive()
  const listings = getPublicHomeListings()
  const t = useT()

  return (
    <section id="browse" className="pb-8">
      <Container>
        <HomeSectionHeader
          title={t("home.recommended")}
          icon={<Sparkles className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />}
        />
        <FeaturedBody listings={listings} />
      </Container>
    </section>
  )
}
