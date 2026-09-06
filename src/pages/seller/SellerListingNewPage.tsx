import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { ListingForm } from "../../components/seller/ListingForm"
import { Container } from "../../components/layout/Container"
import { useT } from "../../i18n"

export function SellerListingNewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const t = useT()
  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return null

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.listTitle")}</h1>
          <p className="mt-2 text-base leading-relaxed text-navy-muted">
            {t("seller.listBody")}
          </p>
          <div className="mt-8">
            <ListingForm
              profile={profile}
              onDraftSaved={(listing) => navigate(`/seller/listings/${listing.id}/edit`, { replace: true })}
              onPreview={(listing) => navigate(`/seller/listings/${listing.id}/preview`)}
            />
          </div>
        </div>
      </Container>
    </main>
  )
}
