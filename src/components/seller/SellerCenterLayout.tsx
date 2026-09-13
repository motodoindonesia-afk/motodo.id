import type { ReactNode } from "react"
import { Link, Outlet } from "react-router-dom"
import { Store } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { publicSellerPath } from "../../lib/sellers"
import { useSellerLive } from "../../lib/useSellerLive"
import { Container } from "../layout/Container"
import { SellerStatusBadge } from "./SellerStatusBadge"
import { SellerCenterMobileNav, SellerCenterSidebar } from "./SellerCenterSidebar"
import { useT } from "../../i18n"

export function SellerCenterLayout({ children }: { children?: ReactNode }) {
  const t = useT()
  const { user, loading } = useAuth()
  useSellerLive()

  if (loading) {
    return (
      <main className="bg-surface py-16">
        <p className="text-center text-sm text-navy-muted">{t("common.loading")}</p>
      </main>
    )
  }

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return null

  const approved = profile.status === "approved"
  const storeHref = publicSellerPath(user.id)

  return (
    <main className="min-w-0 bg-surface py-4 min-[1024px]:py-6">
      <Container>
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[13px] font-semibold text-navy">{profile.businessName}</p>
              <SellerStatusBadge
                status={profile.status}
                label={approved ? t("listing.verifiedSeller") : undefined}
              />
            </div>
            <p className="text-meta text-navy-muted">{t("seller.center")}</p>
          </div>
          {approved ? (
            <Link
              to={storeHref}
              className="shrink-0 rounded-lg border border-line bg-white px-3 py-1.5 text-ui font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t("seller.visitStore")}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 min-[1024px]:flex-row min-[1024px]:items-start min-[1024px]:gap-5">
          <SellerCenterSidebar />
          <div className="min-w-0 flex-1">
            <SellerCenterMobileNav />
            <div className="mt-3 min-w-0 min-[1024px]:mt-0">{children ?? <Outlet />}</div>
          </div>
        </div>
      </Container>
    </main>
  )
}
