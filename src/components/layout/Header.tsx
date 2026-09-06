import { ChevronDown, Menu, ShoppingCart, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { displayName } from "../../lib/auth"
import { getSellerProfile, isSellerProfilesReady } from "../../lib/seller"
import { getUnreadCount } from "../../lib/chat"
import { getUnreadNotificationCount } from "../../lib/notifications"
import { useSellerLive } from "../../lib/useSellerLive"
import { useChatLive } from "../../lib/useChatLive"
import { useNotificationsLive } from "../../lib/useNotificationsLive"
import { UnreadBadge } from "../chat/UnreadBadge"
import { navLinks, searchQuickLinks } from "../../data/site"
import { Button } from "../ui/Button"
import { SearchBar } from "../ui/SearchBar"
import { TextLink } from "../ui/TextLink"
import { Container } from "./Container"
import { UtilityBar } from "./UtilityBar"

export function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  useSellerLive()
  useChatLive()
  useNotificationsLive()
  const sellerProfile = user && isSellerProfilesReady() ? getSellerProfile(user.id) : null
  const sellerRegistered = Boolean(sellerProfile)
  const sellerApproved = sellerProfile?.status === "approved"
  const buyerUnread = user ? getUnreadCount(user.id, "buyer") : 0
  const sellerUnread = user && sellerRegistered ? getUnreadCount(user.id, "seller") : 0
  const notificationUnread = user ? getUnreadNotificationCount(user.id) : 0
  const sellerHref = sellerRegistered ? "/seller/dashboard" : "/seller/register"

  function goToBrowse(query: string) {
    const trimmed = query.trim()
    navigate(trimmed ? `/browse?q=${encodeURIComponent(trimmed)}` : "/browse")
    setOpen(false)
  }

  function handleLogout() {
    setOpen(false)
    navigate("/", { replace: true })
    logout()
  }

  return (
    <header className="w-full min-w-0 border-b border-line bg-white">
      <UtilityBar
        isAuthenticated={isAuthenticated}
        sellerHref={sellerHref}
        notificationUnread={notificationUnread}
        account={
          user ? (
            <AccountMenu
              name={displayName(user)}
              sellerRegistered={sellerRegistered}
              sellerApproved={sellerApproved}
              buyerUnread={buyerUnread}
              sellerUnread={sellerUnread}
              onLogout={handleLogout}
              compact
            />
          ) : null
        }
      />

      <Container className="py-2.5">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <Link to="/" className="mt-1.5 shrink-0 whitespace-nowrap text-[20px] font-extrabold italic tracking-tight text-brand">
            MOTODO
          </Link>

          <div className="min-w-0 flex-1">
            <SearchBar
              id="header-search"
              variant="market"
              placeholder="Cari motor, brand, atau seller..."
              onSubmitSearch={goToBrowse}
            />
            <nav className="mt-1.5 flex min-w-0 gap-2 overflow-x-auto pb-0.5 sm:gap-3" aria-label="Brand shortcuts">
              {searchQuickLinks.map((link) => (
                <Link key={link.label} to={link.href} className="shrink-0 text-meta text-brand hover:text-brand-hover">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            to="/orders"
            className="mt-1.5 shrink-0 rounded-md p-1.5 text-brand hover:bg-brand-soft"
            aria-label="Pesanan"
          >
            <ShoppingCart className="size-6" strokeWidth={1.75} />
          </Link>

          <button
            type="button"
            className="mt-1.5 shrink-0 rounded-lg p-1.5 text-navy lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {open ? (
        <div id="mobile-menu" className="border-t border-line px-5 py-4 lg:hidden">
          <nav className="mt-3 grid gap-2" aria-label="Mobile">
            {navLinks.map((link) => (
              <TextLink key={link.href} href={link.href} className="text-ui" onClick={() => setOpen(false)}>
                {link.label}
              </TextLink>
            ))}
          </nav>
          <div className="mt-3 grid gap-2">
            {isAuthenticated && user ? (
              <>
                <p className="text-ui font-semibold text-navy">{user.fullName}</p>
                <TextLink href="/profile" className="text-ui" onClick={() => setOpen(false)}>
                  My Profile
                </TextLink>
                <TextLink href="/orders" className="text-ui" onClick={() => setOpen(false)}>
                  My Orders
                </TextLink>
                <TextLink href="/messages" className="inline-flex items-center gap-2 text-ui" onClick={() => setOpen(false)}>
                  Messages
                  <UnreadBadge count={buyerUnread} />
                </TextLink>
                <TextLink href="/notifications" className="inline-flex items-center gap-2 text-ui" onClick={() => setOpen(false)}>
                  Notifications
                  <UnreadBadge count={notificationUnread} />
                </TextLink>
                {sellerRegistered ? (
                  <>
                    <TextLink href="/seller/dashboard" className="text-ui" onClick={() => setOpen(false)}>
                      Seller Dashboard
                    </TextLink>
                    {sellerApproved ? (
                      <TextLink href="/seller/listings" className="text-ui" onClick={() => setOpen(false)}>
                        Listings
                      </TextLink>
                    ) : null}
                    <TextLink href="/seller/orders" className="text-ui" onClick={() => setOpen(false)}>
                      Seller Orders
                    </TextLink>
                    <TextLink
                      href="/seller/messages"
                      className="inline-flex items-center gap-2 text-ui"
                      onClick={() => setOpen(false)}
                    >
                      Seller Messages
                      <UnreadBadge count={sellerUnread} />
                    </TextLink>
                    <TextLink href="/seller/profile" className="text-ui" onClick={() => setOpen(false)}>
                      Seller Profile
                    </TextLink>
                    {sellerApproved ? (
                      <TextLink href="/sell" className="text-ui" onClick={() => setOpen(false)}>
                        Sell a Motorcycle
                      </TextLink>
                    ) : null}
                  </>
                ) : (
                  <TextLink href="/seller/register" className="text-ui" onClick={() => setOpen(false)}>
                    Become a Seller
                  </TextLink>
                )}
                <button type="button" className="text-left text-ui text-navy hover:text-brand" onClick={handleLogout}>
                  Log Out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <TextLink href="/login" onClick={() => setOpen(false)}>
                  Login
                </TextLink>
                <Button
                  className="flex-1 py-2 text-ui"
                  onClick={() => {
                    setOpen(false)
                    navigate("/signup")
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}

function AccountMenu({
  name,
  sellerRegistered,
  sellerApproved,
  buyerUnread,
  sellerUnread,
  onLogout,
  compact = false,
}: {
  name: string
  sellerRegistered: boolean
  sellerApproved: boolean
  buyerUnread: number
  sellerUnread: number
  onLogout: () => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={
          compact
            ? "inline-flex max-w-[140px] items-center gap-1 truncate hover:text-white/80"
            : "inline-flex items-center gap-1.5 text-ui font-medium text-navy hover:text-brand"
        }
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {name}
        <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-line bg-white py-2 text-navy">
          <Link to="/profile" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
            My Profile
          </Link>
          <Link to="/orders" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
            My Orders
          </Link>
          <Link
            to="/messages"
            className="flex items-center justify-between gap-2 px-3 py-1.5 text-ui hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            <span>Messages</span>
            <UnreadBadge count={buyerUnread} />
          </Link>
          {sellerRegistered ? (
            <>
              <Link to="/seller/dashboard" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                Seller Dashboard
              </Link>
              {sellerApproved ? (
                <Link to="/seller/listings" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                  Listings
                </Link>
              ) : null}
              <Link to="/seller/orders" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                Seller Orders
              </Link>
              <Link
                to="/seller/messages"
                className="flex items-center justify-between gap-2 px-3 py-1.5 text-ui hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                <span>Seller Messages</span>
                <UnreadBadge count={sellerUnread} />
              </Link>
              <Link to="/seller/profile" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                Seller Profile
              </Link>
              {sellerApproved ? (
                <Link to="/sell" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                  Sell a Motorcycle
                </Link>
              ) : null}
            </>
          ) : (
            <Link to="/seller/register" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
              Become a Seller
            </Link>
          )}
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-ui hover:bg-surface"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            Log Out
          </button>
        </div>
      ) : null}
    </div>
  )
}
