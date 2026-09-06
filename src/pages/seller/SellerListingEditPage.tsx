import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { canManageListing, getListingById } from "../../lib/listings"
import { useListingsLive } from "../../lib/useListingsLive"
import { ListingForm } from "../../components/seller/ListingForm"
import { SellerListingAccessMessage } from "../../components/seller/SellerListingAccessMessage"
import { Container } from "../../components/layout/Container"
import { useT } from "../../i18n"

export function SellerListingEditPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useListingsLive()
  const t = useT()

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return null
  const listing = id ? getListingById(id) : null

  if (!listing) {
    return <SellerListingAccessMessage title={t("seller.notFoundListing")} onBack={() => navigate("/seller/listings")} />
  }

  if (!canManageListing(listing, user.id)) {
    return (
      <SellerListingAccessMessage
        title={t("seller.noListingAccess")}
        onBack={() => navigate("/seller/listings")}
      />
    )
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.editTitle")}</h1>
          <p className="mt-2 text-base leading-relaxed text-navy-muted">
            {t("seller.listBody")}
          </p>
          <div className="mt-8">
            <ListingForm
              mode="edit"
              profile={profile}
              listing={listing}
              onDraftSaved={() => navigate("/seller/listings", { state: { saved: true } })}
              onPreview={(saved) => navigate(`/seller/listings/${saved.id}/preview`)}
              onSaved={() => navigate("/seller/listings", { state: { saved: true } })}
            />
          </div>
        </div>
      </Container>
    </main>
  )
}
