import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { OPS } from "../../lib/opsPaths"
import { cn } from "../../lib/cn"

const marketplace = [
  { to: OPS.sellers, label: "Sellers" },
  { to: OPS.listings, label: "Listings" },
  { to: OPS.orders, label: "Orders" },
  { to: OPS.reviews, label: "Reviews" },
]

function itemClass({ isActive }: { isActive: boolean }) {
  return cn(
    "block rounded-lg px-3 py-2 text-sm font-medium",
    isActive ? "bg-brand/10 text-brand" : "text-navy-muted hover:bg-surface hover:text-navy",
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-6" aria-label="Ritme">
      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-muted">Ritme</p>
        <div className="mt-2">
          <NavLink to={OPS.dashboard} className={itemClass} onClick={onNavigate}>
            Dashboard
          </NavLink>
        </div>
      </div>
      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-muted">Marketplace</p>
        <div className="mt-2 space-y-0.5">
          {marketplace.map((item) => (
            <NavLink key={item.to} to={item.to} className={itemClass} onClick={onNavigate}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-muted">Users</p>
        <div className="mt-2">
          <NavLink to={OPS.users} className={itemClass} onClick={onNavigate}>
            Users
          </NavLink>
        </div>
      </div>
      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-muted">System</p>
        <div className="mt-2">
          <NavLink to={OPS.settings} className={itemClass} onClick={onNavigate}>
            Settings
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

export function RitmeShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate(OPS.login, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-navy">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="border-b border-line px-5 py-5">
          <p className="text-lg font-bold tracking-tight text-navy">RITME</p>
          <p className="mt-0.5 text-xs text-navy-muted">Motodo Operations</p>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-line px-4 py-4">
          <p className="truncate text-sm font-medium text-navy">{user?.fullName ?? "Admin"}</p>
          <p className="truncate text-xs text-navy-muted">{user?.email?.trim() || "Admin"}</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-navy-muted hover:text-navy"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-navy"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div>
            <p className="text-sm font-bold tracking-tight">RITME</p>
            <p className="text-xs text-navy-muted">Motodo Operations</p>
          </div>
        </header>
        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" className="absolute inset-0 bg-navy/20" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div className="relative flex h-full w-60 flex-col bg-white shadow-lg">
              <div className="border-b border-line px-5 py-5">
                <p className="text-lg font-bold tracking-tight text-navy">RITME</p>
                <p className="mt-0.5 text-xs text-navy-muted">Motodo Operations</p>
              </div>
              <SidebarNav onNavigate={() => setOpen(false)} />
              <div className="mt-auto border-t border-line px-4 py-4">
                <p className="truncate text-sm font-medium text-navy">{user?.fullName ?? "Admin"}</p>
                <button type="button" className="mt-3 text-sm font-medium text-navy-muted hover:text-navy" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <Outlet />
      </div>
    </div>
  )
}
