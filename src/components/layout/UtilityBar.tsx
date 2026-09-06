import type { ReactNode } from "react"
import { Bell, ChevronDown, CircleHelp, Globe } from "lucide-react"
import { Link } from "react-router-dom"
import { Container } from "./Container"

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
  return (
    <div className="bg-navy text-white">
      <Container className="flex h-8 min-w-0 items-center justify-between gap-2 overflow-x-auto text-[11px] leading-none sm:gap-3 sm:text-meta lg:overflow-visible">
        <div className="flex shrink-0 items-center gap-2.5">
          <Link to={sellerHref} className="whitespace-nowrap hover:text-white/80">
            Seller Centre
          </Link>
          <Divider />
          <Link to="/sell" className="whitespace-nowrap hover:text-white/80">
            Mulai Berjualan
          </Link>
          <Divider />
          <a href="/#app-store" className="whitespace-nowrap hover:text-white/80">
            Download App
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Link to="/notifications" className="inline-flex items-center gap-1 hover:text-white/80">
            <Bell className="size-3.5" aria-hidden="true" />
            Notifikasi
            {notificationUnread > 0 ? (
              <span className="rounded-full bg-brand px-1 text-[10px] font-medium">{notificationUnread}</span>
            ) : null}
          </Link>
          <Link to="/#help" className="inline-flex items-center gap-1 hover:text-white/80">
            <CircleHelp className="size-3.5" aria-hidden="true" />
            Bantuan
          </Link>
          <span className="inline-flex items-center gap-1 text-white/90">
            <Globe className="size-3.5" aria-hidden="true" />
            Bahasa Indonesia
            <ChevronDown className="size-3" aria-hidden="true" />
          </span>
          {isAuthenticated ? (
            account
          ) : (
            <>
              <Divider />
              <Link to="/signup" className="hover:text-white/80">
                Daftar
              </Link>
              <Divider />
              <Link to="/login" className="hover:text-white/80">
                Log In
              </Link>
            </>
          )}
        </div>
      </Container>
    </div>
  )
}
