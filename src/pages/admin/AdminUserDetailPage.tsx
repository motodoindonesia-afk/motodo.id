import { Link, useNavigate, useParams } from "react-router-dom"
import { AdminNav } from "../../components/admin/AdminNav"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import {
  accountStatusLabel,
  accountTypeLabel,
  buyerOrderCount,
  getAdminDirectoryUser,
  platformRole,
  privilegeLabel,
} from "../../lib/adminPlatform"
import { formatShortDate } from "../../lib/profile"
import { getSellerProfile } from "../../lib/seller"
import { useAdminUsersLive } from "../../lib/useAdminUsersLive"
import { useSellerLive } from "../../lib/useSellerLive"
import { useOrdersLive } from "../../lib/useOrdersLive"

export function AdminUserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  useSellerLive()
  useOrdersLive()
  useAdminUsersLive()
  const user = userId ? getAdminDirectoryUser(userId) : null
  const seller = user ? getSellerProfile(user.id) : null

  if (!user) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container className="max-w-xl text-center">
          <h1 className="text-2xl font-bold text-navy">User not found</h1>
          <Button className="mt-6" onClick={() => navigate("/admin/users")}>
            Back to users
          </Button>
        </Container>
      </main>
    )
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Admin</h1>
          <AdminNav />
          <p className="mt-6 text-sm">
            <Link to="/admin/users" className="font-medium text-brand hover:text-brand-hover">
              ← Users
            </Link>
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy">{user.fullName}</h2>

          <section className="mt-8 rounded-2xl border border-line px-5 py-6">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Name</dt>
                <dd className="font-medium text-navy">{user.fullName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Email</dt>
                <dd className="font-medium text-navy">{user.email.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Account type</dt>
                <dd className="font-medium text-navy">{accountTypeLabel(user)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Authorization</dt>
                <dd className="font-medium text-navy">{privilegeLabel(user)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Role</dt>
                <dd className="font-medium text-navy">{platformRole(user)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Created Date</dt>
                <dd className="font-medium text-navy">{formatShortDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Account Status</dt>
                <dd className="font-medium text-navy">{accountStatusLabel()}</dd>
              </div>
              {seller ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">Seller Profile</dt>
                  <dd>
                    <Link to={`/admin/sellers/${seller.id}`} className="font-medium text-brand hover:text-brand-hover">
                      View Seller Profile
                    </Link>
                  </dd>
                </div>
              ) : (
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">Order Count</dt>
                  <dd className="font-medium text-navy">{buyerOrderCount(user.id)}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </Container>
    </main>
  )
}
