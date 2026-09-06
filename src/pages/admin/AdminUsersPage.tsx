import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthInput } from "../../components/auth/AuthField"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { cn } from "../../lib/cn"
import { accountTypeLabel, getAllUsers, privilegeLabel } from "../../lib/adminPlatform"
import { formatShortDate } from "../../lib/profile"
import { useAdminUsersLive } from "../../lib/useAdminUsersLive"
import { useSellerLive } from "../../lib/useSellerLive"

const FILTERS: { id: "all" | "buyer" | "seller" | "admin"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buyer", label: "Buyer" },
  { id: "seller", label: "Seller" },
  { id: "admin", label: "Admin" },
]

export function AdminUsersPage() {
  useSellerLive()
  useAdminUsersLive()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")
  const [query, setQuery] = useState("")
  const users = getAllUsers()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return users.filter((user) => {
      const accountType = accountTypeLabel(user).toLowerCase()
      const role = privilegeLabel(user).toLowerCase()
      if (filter === "admin" && role !== "admin") return false
      if (filter === "buyer" && (accountType !== "buyer" || role === "admin")) return false
      if (filter === "seller" && accountType !== "seller") return false
      if (!needle) return true
      return `${user.fullName} ${user.email} ${accountType} ${role}`.toLowerCase().includes(needle)
    })
  }, [users, filter, query])

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Users</h1>
          <p className="mt-2 text-navy-muted">Accounts from public.profiles. Read-only.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  filter === item.id ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
                )}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-md">
            <AuthInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email"
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            {visible.length === 0 ? (
              <p className="px-5 py-8 text-sm text-navy-muted">No users match this filter.</p>
            ) : (
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-surface">
                  <tr className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Account type</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((user) => (
                    <tr key={user.id} className="border-t border-line">
                      <td className="px-4 py-3 text-sm font-medium text-navy">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{accountTypeLabel(user)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{privilegeLabel(user)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatShortDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{user.updatedAt ? formatShortDate(user.updatedAt) : "—"}</td>
                      <td className="px-4 py-3">
                        <Button variant="secondary" onClick={() => navigate(`/users/${user.id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-navy-muted">
              Email is not stored on public.profiles, so it is shown only when already available on the signed-in session.
            </p>
          </div>
        </div>
      </Container>
    </main>
  )
}
