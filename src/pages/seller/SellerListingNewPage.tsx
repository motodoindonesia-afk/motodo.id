import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { ListingForm } from "../../components/seller/ListingForm"
import { useT } from "../../i18n"

export function SellerListingNewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const t = useT()
  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return null

  return (
    <div className="min-w-0">
          <h1 className="text-heading font-semibold tracking-tight text-navy">{t("seller.listTitle")}</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-navy-muted">
            {t("seller.listBody")}
          </p>
          <div className="mt-6">
            <ListingForm
              profile={profile}
              onDraftSaved={(listing) => navigate(`/seller/listings/${listing.id}/edit`, { replace: true })}
              onPreview={(listing) => navigate(`/seller/listings/${listing.id}/preview`)}
            />
          </div>
    </div>
  )
}
