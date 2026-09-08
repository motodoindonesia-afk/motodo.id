import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { accountUsername } from "../../lib/profile"
import { Container } from "../layout/Container"
import { AccountMobileNav, AccountSidebar } from "./AccountSidebar"
import { UserAvatar } from "./UserAvatar"
import { useT } from "../../i18n"

export function AccountLayout({
  children,
  showIdentityBar = true,
}: {
  children: ReactNode
  showIdentityBar?: boolean
}) {
  const t = useT()
  const navigate = useNavigate()
  const { user, profile, logout, loading } = useAuth()

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
    <main className="bg-surface py-4 min-[769px]:py-6">
      <Container>
        <div className="flex flex-col gap-4 min-[769px]:flex-row min-[769px]:items-start min-[769px]:gap-5">
          <AccountSidebar name={displayName} username={username} onLogout={handleLogout} />
          <div className="min-w-0 flex-1">
            {showIdentityBar ? (
              <div className="mb-3 flex items-center gap-3 min-[769px]:hidden">
                <UserAvatar name={displayName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{displayName}</p>
                  <p className="truncate text-[12px] text-navy-muted">{user.email}</p>
                </div>
                <Link
                  to="/profile/edit"
                  className="shrink-0 rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t("account.editProfile")}
                </Link>
              </div>
            ) : null}
            <AccountMobileNav onLogout={handleLogout} />
            <div className="mt-3 min-[769px]:mt-0">{children}</div>
          </div>
        </div>
      </Container>
    </main>
  )
}
