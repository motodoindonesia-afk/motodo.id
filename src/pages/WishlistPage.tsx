import { Heart } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Container } from "../components/layout/Container"
import { MotorcycleCard } from "../components/ui/MotorcycleCard"
import { useFavorites } from "../context/FavoritesContext"
import { ensureRemoteListing, getListingById, toCatalogListing } from "../lib/listings"
import { isSupabaseConfigured } from "../lib/supabase"
import { useListingsLive } from "../lib/useListingsLive"
import type { MotorcycleListing as CatalogListing } from "../types/marketplace"
import { useT } from "../i18n"

function listingUnavailable(listing: CatalogListing | null) {
  if (!listing) return true
  if (listing.status === "sold" || listing.status === "draft") return true
  if ((listing.quantity ?? 0) <= 0) return true
  return false
}

export function WishlistPage() {
  const t = useT()
  const listingVersion = useListingsLive()
  const { listingIds, loading } = useFavorites()
  const [resolving, setResolving] = useState(false)
  const ids = useMemo(() => Array.from(listingIds), [listingIds])

  useEffect(() => {
    if (!isSupabaseConfigured() || ids.length === 0) {
      setResolving(false)
      return
    }
    let cancelled = false
    setResolving(true)
    void Promise.all(ids.map((id) => ensureRemoteListing(id))).finally(() => {
      if (!cancelled) setResolving(false)
    })
    return () => {
      cancelled = true
    }
  }, [ids, listingVersion])

  const items = useMemo(() => {
    return ids.map((id) => {
      const stored = getListingById(id)
      const listing = stored ? toCatalogListing(stored) : null
      return { id, listing }
    })
  }, [ids, listingVersion, resolving])

  return (
    <main className="bg-white pb-10 sm:pb-12">
      <Container className="pt-6 sm:pt-8">
        <h1 className="text-xl font-bold tracking-tight text-navy sm:text-2xl">{t("wishlist.title")}</h1>

        {loading || resolving ? (
          <p className="mt-8 text-sm text-navy-muted">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md px-1 py-8 text-center">
            <Heart className="mx-auto size-8 text-brand" strokeWidth={1.75} aria-hidden="true" />
            <h2 className="mt-3 text-base font-bold text-navy">{t("wishlist.emptyTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-navy-muted">{t("wishlist.emptyBody")}</p>
            <Link
              to="/browse"
              className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
            >
              {t("wishlist.browseCta")}
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2.5 min-[769px]:gap-3 lg:grid-cols-3">
            {items.map(({ id, listing }) => {
              const unavailable = listingUnavailable(listing)
              const cardListing: CatalogListing = listing ?? {
                id,
                sellerId: "",
                name: t("wishlist.unavailableName"),
                price: "—",
                priceValue: 0,
                year: 0,
                location: "",
                category: "Others",
                image: "",
                images: [],
                mileage: "—",
                engine: "—",
                transmission: "—",
                fuel: "—",
                color: "—",
                description: "",
                seller: { name: "", location: "", memberSince: "", verified: false },
                listedAt: "",
                status: "sold",
              }
              return (
                <MotorcycleCard
                  key={id}
                  listing={cardListing}
                  href={listing && listing.status !== "draft" ? `/motorcycles/${id}` : undefined}
                  showCategory={Boolean(listing)}
                  unavailable={unavailable}
                />
              )
            })}
          </div>
        )}
      </Container>
    </main>
  )
}
