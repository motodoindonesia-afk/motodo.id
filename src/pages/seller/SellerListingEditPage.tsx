import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { canManageListing, getListingById } from "../../lib/listings"
import { useListingsLive } from "../../lib/useListingsLive"
import { ListingForm } from "../../components/seller/ListingForm"
import { SellerListingAccessMessage } from "../../components/seller/SellerListingAccessMessage"
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
    <div className="min-w-0">
          <h1 className="text-heading font-semibold tracking-tight text-navy">{t("seller.editTitle")}</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-navy-muted">
            {t("seller.listBody")}
          </p>
          <div className="mt-6">
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
  )
}
