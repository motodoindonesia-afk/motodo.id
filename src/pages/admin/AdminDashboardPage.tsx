import { Link } from "react-router-dom"
import { getSellerStats, listSellerProfiles } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"
import { AdminSellerRow } from "../../components/admin/AdminSellerRow"
import { Container } from "../../components/layout/Container"

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-5">
      <p className="text-sm text-navy-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-navy">{value}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  useSellerLive()
  const stats = getSellerStats()
  const pending = listSellerProfiles().filter((item) => item.status === "pending")

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Admin Dashboard</h1>
          <p className="mt-2 text-navy-muted">Manage Motodo marketplace operations.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pending Seller Verifications" value={stats.pending} />
            <StatCard label="Approved Sellers" value={stats.approved} />
            <StatCard label="Rejected Sellers" value={stats.rejected} />
            <StatCard label="Total Sellers" value={stats.total} />
          </div>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl font-bold text-navy">Pending Seller Verifications</h2>
              <Link to="/admin/sellers" className="text-sm font-medium text-brand hover:text-brand-hover">
                View all sellers
              </Link>
            </div>
            {pending.length === 0 ? (
              <p className="mt-4 text-sm text-navy-muted">No pending seller registrations.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-line">
                <table className="w-full text-left">
                  <thead className="hidden bg-surface md:table-header-group">
                    <tr className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                      <th className="px-4 py-3">Business</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">NIB</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((seller) => (
                      <AdminSellerRow key={seller.id} seller={seller} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </Container>
    </main>
  )
}
