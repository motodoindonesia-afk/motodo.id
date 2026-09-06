import { Flame } from "lucide-react"
import { useListingsLive } from "../../lib/useListingsLive"
import { Container } from "../layout/Container"
import { ListingCard } from "../ui/ListingCard"
import { ListingCardSkeleton } from "../ui/ListingCardSkeleton"
import { EmptyState } from "../ui/EmptyState"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { HOME_PRODUCT_COUNT, HomeProductCell, HomeProductGrid } from "./HomeProductGrid"
import { getPublicHomeListings } from "./homeListings"
import { useT } from "../../i18n"

export function BestSellers() {
  useListingsLive()
  const listings = getPublicHomeListings()
  const t = useT()

  return (
    <section className="pb-6">
      <Container>
        <HomeSectionHeader
          title={t("home.bestSellers")}
          icon={<Flame className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />}
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
            {listings.slice(0, HOME_PRODUCT_COUNT).map((listing, index) => (
              <HomeProductCell key={listing.id}>
                <ListingCard
                  listing={listing}
                  badge={
                    <span className="rounded-sm bg-navy px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {t("home.top", { n: index + 1 })}
                    </span>
                  }
                />
              </HomeProductCell>
            ))}
          </HomeProductGrid>
        )}
      </Container>
    </section>
  )
}
