import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  deleteListing,
  filterAndSortSellerListings,
  getListingsBySeller,
  getSellerListingCounts,
  markListingAsActive,
  markListingAsSold,
  type SellerListingSort,
} from "../../lib/listings"
import { SellerNav } from "../../components/seller/SellerNav"
import { useListingsLive } from "../../lib/useListingsLive"
import type { MotorcycleListing, SellerListingStatus } from "../../types/sellerListing"
import { ConfirmListingModal } from "../../components/seller/ConfirmListingModal"
import { DeleteListingModal } from "../../components/seller/DeleteListingModal"
import { SellerListingCard } from "../../components/seller/SellerListingCard"
import { AuthInput } from "../../components/auth/AuthField"
import { AuthSelect } from "../../components/auth/AuthField"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { cn } from "../../lib/cn"
import { sortOptionLabel, useLanguage, type MessageKey } from "../../i18n"

const FILTERS: { id: "all" | SellerListingStatus; key: MessageKey }[] = [
  { id: "all", key: "browse.all" },
  { id: "active", key: "seller.statusActive" },
  { id: "draft", key: "seller.statusDraft" },
  { id: "sold", key: "seller.statusSold" },
]

type LocationState = { published?: boolean; saved?: boolean; deleted?: boolean }

export function SellerListingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  useListingsLive()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SellerListingSort>("newest")
  const [deleteTarget, setDeleteTarget] = useState<MotorcycleListing | null>(null)
  const [soldTarget, setSoldTarget] = useState<MotorcycleListing | null>(null)
  const [activeTarget, setActiveTarget] = useState<MotorcycleListing | null>(null)
  const { locale, t } = useLanguage()
  const flash = (location.state as LocationState | null) ?? {}
  const listings = user ? getListingsBySeller(user.id) : []
  const counts = user ? getSellerListingCounts(user.id) : { total: 0, active: 0, draft: 0, sold: 0 }
  const visible = useMemo(
    () => filterAndSortSellerListings(listings, { status: filter, query, sort }),
    [listings, filter, query, sort],
  )

  if (!user) return null

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.myListings")}</h1>
              <p className="mt-2 text-navy-muted">{t("seller.manageBody")}</p>
            </div>
            <Button onClick={() => navigate("/seller/listings/new")}>{t("profile.addMotorcycle")}</Button>
          </div>
          <SellerNav approved />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("seller.totalListings")} value={counts.total} />
            <StatCard label={t("seller.statusActive")} value={counts.active} />
            <StatCard label={t("seller.statusDraft")} value={counts.draft} />
            <StatCard label={t("seller.statusSold")} value={counts.sold} />
          </div>

          {flash.published ? (
            <p className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-medium text-navy" role="status">
              {t("seller.published")}
            </p>
          ) : null}
          {flash.saved ? (
            <p className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-medium text-navy" role="status">
              {t("seller.updated")}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  filter === item.id ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
                )}
              >
                {t(item.key)}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <AuthInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("seller.searchListings")}
            />
            <AuthSelect value={sort} onChange={(event) => setSort(event.target.value as SellerListingSort)}>
              <option value="newest">{sortOptionLabel(locale, "newest")}</option>
              <option value="oldest">{sortOptionLabel(locale, "oldest")}</option>
              <option value="price-asc">{sortOptionLabel(locale, "price-asc")}</option>
              <option value="price-desc">{sortOptionLabel(locale, "price-desc")}</option>
            </AuthSelect>
          </div>

          {listings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line px-5 py-10 text-center">
              <p className="text-sm text-navy-muted">{t("profile.noListings")}</p>
              <Button className="mt-4" onClick={() => navigate("/seller/listings/new")}>
                {t("profile.addMotorcycle")}
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-8 text-sm text-navy-muted">{t("seller.noMatch")}</p>
          ) : (
            <div className="mt-8 grid gap-4">
              {visible.map((listing) => (
                <SellerListingCard
                  key={listing.id}
                  listing={listing}
                  onDelete={setDeleteTarget}
                  onMarkSold={setSoldTarget}
                  onMarkActive={setActiveTarget}
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      {deleteTarget ? (
        <DeleteListingModal
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteListing(deleteTarget.id, user.id)
            setDeleteTarget(null)
          }}
        />
      ) : null}
      {soldTarget ? (
        <ConfirmListingModal
          title={t("seller.markSold")}
          message={t("seller.markSoldQ")}
          confirmLabel={t("seller.markSold")}
          onCancel={() => setSoldTarget(null)}
          onConfirm={async () => {
            await markListingAsSold(soldTarget.id, user.id)
            setSoldTarget(null)
          }}
        />
      ) : null}
      {activeTarget ? (
        <ConfirmListingModal
          title={t("seller.markActive")}
          message={t("seller.markActiveQ")}
          confirmLabel={t("seller.markActive")}
          onCancel={() => setActiveTarget(null)}
          onConfirm={async () => {
            await markListingAsActive(activeTarget.id, user.id)
            setActiveTarget(null)
          }}
        />
      ) : null}
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-sm text-navy-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
    </div>
  )
}
