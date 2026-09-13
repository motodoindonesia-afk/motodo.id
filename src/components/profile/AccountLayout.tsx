import type { ReactNode } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { accountUsername } from "../../lib/profile"
import { Container } from "../layout/Container"
import { AccountMobileNav, AccountSidebar } from "./AccountSidebar"
import { UserAvatar } from "./UserAvatar"
import { useT } from "../../i18n"

export function AccountLayout({
  children,
  showIdentityBar,
}: {
  children?: ReactNode
  showIdentityBar?: boolean
}) {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout, loading } = useAuth()
  const identityBar = showIdentityBar ?? location.pathname !== "/profile"

  if (loading) {
    return (
      <main className="bg-surface py-16">
        <p className="text-center text-sm text-navy-muted">{t("common.loading")}</p>
      </main>
    )
  }

  if (!user) return null

  const displayName = profile?.fullName ?? user.fullName
  const username = accountUsername(user.email)

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <main className="min-w-0 bg-surface py-4 min-[769px]:py-6">
      <Container>
        <div className="flex flex-col gap-4 min-[769px]:flex-row min-[769px]:items-start min-[769px]:gap-5">
          <AccountSidebar name={displayName} username={username} onLogout={handleLogout} />
          <div className="min-w-0 flex-1">
            {identityBar ? (
              <div className="mb-3 flex min-w-0 flex-wrap items-center gap-3 min-[769px]:hidden">
                <UserAvatar name={displayName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{displayName}</p>
                  <p className="truncate text-meta text-navy-muted">{user.email}</p>
                </div>
                <Link
                  to="/profile/edit"
                  className="shrink-0 rounded-lg border border-line bg-white px-3 py-1.5 text-ui font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t("account.editProfile")}
                </Link>
              </div>
            ) : null}
            <AccountMobileNav onLogout={handleLogout} />
            <div className="mt-3 min-w-0 min-[769px]:mt-0">{children ?? <Outlet />}</div>
          </div>
        </div>
      </Container>
    </main>
  )
}
