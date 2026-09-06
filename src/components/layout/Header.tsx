import { ChevronDown, Menu, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { displayName } from "../../lib/auth"
import { isAdmin } from "../../lib/admin"
import { getSellerProfile, isSellerProfilesReady } from "../../lib/seller"
import { getUnreadCount } from "../../lib/chat"
import { getUnreadNotificationCount } from "../../lib/notifications"
import { useSellerLive } from "../../lib/useSellerLive"
import { useChatLive } from "../../lib/useChatLive"
import { useNotificationsLive } from "../../lib/useNotificationsLive"
import { UnreadBadge } from "../chat/UnreadBadge"
import { NotificationBell } from "../notifications/NotificationBell"
import { navLinks } from "../../data/site"
import { Button } from "../ui/Button"
import { SearchBar } from "../ui/SearchBar"
import { TextLink } from "../ui/TextLink"
import { Container } from "./Container"

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
  const showAdmin = isAdmin(user)
  const buyerUnread = user ? getUnreadCount(user.id, "buyer") : 0
  const sellerUnread = user && sellerRegistered ? getUnreadCount(user.id, "seller") : 0
  const notificationUnread = user ? getUnreadNotificationCount(user.id) : 0

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
    <header className="border-b border-line/80 bg-white">
      <Container className="flex h-16 items-center gap-4 lg:h-[72px] lg:gap-6">
        <Link to="/" className="shrink-0 text-lg font-bold tracking-tight text-navy">
          Motodo
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <TextLink key={link.href} href={link.href}>
              {link.label}
            </TextLink>
          ))}
        </nav>

        <SearchBar
          id="header-search"
          className="hidden min-w-0 flex-1 sm:block lg:max-w-lg"
          onSubmitSearch={goToBrowse}
        />

        <div className="ml-auto hidden items-center gap-4 lg:flex">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/orders"
                className="text-sm font-medium text-navy hover:text-brand"
              >
                Orders
              </Link>
              <Link
                to="/messages"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:text-brand"
              >
                Messages
                <UnreadBadge count={buyerUnread} />
              </Link>
              <NotificationBell />
              <AccountMenu
                name={displayName(user)}
                sellerRegistered={sellerRegistered}
                sellerApproved={sellerApproved}
                showAdmin={showAdmin}
                buyerUnread={buyerUnread}
                sellerUnread={sellerUnread}
                onLogout={handleLogout}
              />
            </>
          ) : (
            <>
              <TextLink href="/login">Login</TextLink>
              <Button onClick={() => navigate("/signup")}>Sign Up</Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-navy lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open ? (
        <div id="mobile-menu" className="border-t border-line px-5 py-4 lg:hidden">
          <SearchBar id="header-search-mobile" className="sm:hidden" onSubmitSearch={goToBrowse} />
          <nav className="mt-4 grid gap-3" aria-label="Mobile">
            {navLinks.map((link) => (
              <TextLink
                key={link.href}
                href={link.href}
                className="py-1"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </TextLink>
            ))}
          </nav>
          <div className="mt-4 grid gap-3">
            {isAuthenticated && user ? (
              <>
                <p className="text-sm font-semibold text-navy">{user.fullName}</p>
                <TextLink href="/profile" className="py-1" onClick={() => setOpen(false)}>
                  My Profile
                </TextLink>
                <TextLink href="/orders" className="py-1" onClick={() => setOpen(false)}>
                  My Orders
                </TextLink>
                <TextLink href="/messages" className="inline-flex items-center gap-2 py-1" onClick={() => setOpen(false)}>
                  Messages
                  <UnreadBadge count={buyerUnread} />
                </TextLink>
                <TextLink href="/notifications" className="inline-flex items-center gap-2 py-1" onClick={() => setOpen(false)}>
                  Notifications
                  <UnreadBadge count={notificationUnread} />
                </TextLink>
                {showAdmin ? (
                  <TextLink href="/admin" className="py-1" onClick={() => setOpen(false)}>
                    Admin
                  </TextLink>
                ) : null}
                {sellerRegistered ? (
                  <>
                    <TextLink href="/seller/dashboard" className="py-1" onClick={() => setOpen(false)}>
                      Seller Dashboard
                    </TextLink>
                    {sellerApproved ? (
                      <TextLink href="/seller/listings" className="py-1" onClick={() => setOpen(false)}>
                        Listings
                      </TextLink>
                    ) : null}
                    <TextLink href="/seller/orders" className="py-1" onClick={() => setOpen(false)}>
                      Seller Orders
                    </TextLink>
                    <TextLink
                      href="/seller/messages"
                      className="inline-flex items-center gap-2 py-1"
                      onClick={() => setOpen(false)}
                    >
                      Seller Messages
                      <UnreadBadge count={sellerUnread} />
                    </TextLink>
                    <TextLink href="/seller/profile" className="py-1" onClick={() => setOpen(false)}>
                      Seller Profile
                    </TextLink>
                    {sellerApproved ? (
                      <TextLink href="/sell" className="py-1" onClick={() => setOpen(false)}>
                        Sell a Motorcycle
                      </TextLink>
                    ) : null}
                  </>
                ) : (
                  <TextLink href="/seller/register" className="py-1" onClick={() => setOpen(false)}>
                    Become a Seller
                  </TextLink>
                )}
                <button
                  type="button"
                  className="text-left text-sm text-navy hover:text-brand"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <TextLink href="/login" onClick={() => setOpen(false)}>
                  Login
                </TextLink>
                <Button
                  className="flex-1"
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
  showAdmin,
  buyerUnread,
  sellerUnread,
  onLogout,
}: {
  name: string
  sellerRegistered: boolean
  sellerApproved: boolean
  showAdmin: boolean
  buyerUnread: number
  sellerUnread: number
  onLogout: () => void
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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:text-brand"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {name}
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-line bg-white py-2">
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-navy hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            My Profile
          </Link>
          <Link
            to="/orders"
            className="block px-4 py-2 text-sm text-navy hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            My Orders
          </Link>
          <Link
            to="/messages"
            className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-navy hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            <span>Messages</span>
            <UnreadBadge count={buyerUnread} />
          </Link>
          {showAdmin ? (
            <Link
              to="/admin"
              className="block px-4 py-2 text-sm text-navy hover:bg-surface"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          ) : null}
          {sellerRegistered ? (
            <>
              <Link
                to="/seller/dashboard"
                className="block px-4 py-2 text-sm text-navy hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                Seller Dashboard
              </Link>
              {sellerApproved ? (
                <Link
                  to="/seller/listings"
                  className="block px-4 py-2 text-sm text-navy hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  Listings
                </Link>
              ) : null}
              <Link
                to="/seller/orders"
                className="block px-4 py-2 text-sm text-navy hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                Seller Orders
              </Link>
              <Link
                to="/seller/messages"
                className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-navy hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                <span>Seller Messages</span>
                <UnreadBadge count={sellerUnread} />
              </Link>
              <Link
                to="/seller/profile"
                className="block px-4 py-2 text-sm text-navy hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                Seller Profile
              </Link>
              {sellerApproved ? (
                <Link
                  to="/sell"
                  className="block px-4 py-2 text-sm text-navy hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  Sell a Motorcycle
                </Link>
              ) : null}
            </>
          ) : (
            <Link
              to="/seller/register"
              className="block px-4 py-2 text-sm text-navy hover:bg-surface"
              onClick={() => setOpen(false)}
            >
              Become a Seller
            </Link>
          )}
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-navy hover:bg-surface"
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
