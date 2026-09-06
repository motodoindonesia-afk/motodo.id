import type { ReactNode } from "react"
import { Bell, CircleHelp } from "lucide-react"
import { Link } from "react-router-dom"
import { Container } from "./Container"
import { LanguageSwitcher, useT } from "../../i18n"

function Divider() {
  return <span className="h-3 w-px bg-white/35" aria-hidden="true" />
}

export function UtilityBar({
  isAuthenticated,
  sellerHref,
  notificationUnread,
  account,
}: {
  isAuthenticated: boolean
  sellerHref: string
  notificationUnread: number
  account: ReactNode
}) {
  const t = useT()

  return (
    <div className="hidden bg-navy text-white min-[769px]:block">
      <Container className="flex h-8 min-w-0 items-center justify-between gap-2 overflow-x-auto text-[11px] leading-none sm:gap-3 sm:text-meta lg:overflow-visible">
        <div className="flex shrink-0 items-center gap-2.5">
          <Link to={sellerHref} className="whitespace-nowrap hover:text-white/80">
            {t("nav.sellerCentre")}
          </Link>
          <Divider />
          <Link to="/sell" className="whitespace-nowrap hover:text-white/80">
            {t("nav.startSelling")}
          </Link>
          <Divider />
          <a href="/#app-store" className="whitespace-nowrap hover:text-white/80">
            {t("nav.downloadApp")}
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Link to="/notifications" className="inline-flex items-center gap-1 hover:text-white/80">
            <Bell className="size-3.5" aria-hidden="true" />
            {t("common.notifications")}
            {notificationUnread > 0 ? (
              <span className="rounded-full bg-brand px-1 text-[10px] font-medium">{notificationUnread}</span>
            ) : null}
          </Link>
          <Link to="/#help" className="inline-flex items-center gap-1 hover:text-white/80">
            <CircleHelp className="size-3.5" aria-hidden="true" />
            {t("nav.help")}
          </Link>
          <LanguageSwitcher />
          {isAuthenticated ? (
            account
          ) : (
            <>
              <Divider />
              <Link to="/signup" className="hover:text-white/80">
                {t("common.signup")}
              </Link>
              <Divider />
              <Link to="/login" className="hover:text-white/80">
                {t("common.login")}
              </Link>
            </>
          )}
        </div>
      </Container>
    </div>
  )
}
