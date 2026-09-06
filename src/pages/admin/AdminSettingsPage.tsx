import { AdminNav } from "../../components/admin/AdminNav"
import { Container } from "../../components/layout/Container"
import { isSupabaseConfigured } from "../../lib/supabase"
import { SELLER_SUCCESS_FEE_RATE } from "../../lib/orders"

export function AdminSettingsPage() {
  const feePercent = Math.round(SELLER_SUCCESS_FEE_RATE * 100)
  const adminSource = isSupabaseConfigured()
    ? "profiles.role = admin"
    : "Mock only: admin@motodo.id (not used when Supabase Auth is on)"

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Settings</h1>
          <p className="mt-2 text-navy-muted">Platform configuration for the Motodo admin MVP.</p>
          <AdminNav />

          <section className="mt-8 rounded-2xl border border-line px-5 py-6">
            <h2 className="text-lg font-bold text-navy">Marketplace</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Motodo Success Fee</dt>
                <dd className="font-medium text-navy">{feePercent}% of buyer total</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Admin account</dt>
                <dd className="font-medium text-navy">{adminSource}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Payments</dt>
                <dd className="font-medium text-navy">Not connected</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Third-party logistics</dt>
                <dd className="font-medium text-navy">Coming Soon</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Notifications</dt>
                <dd className="font-medium text-navy">Existing in-app notifications</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-navy-muted">
              User suspension, audit logs, payouts, and live payments will be added when Motodo moves to a server-backed
              admin.
            </p>
          </section>
        </div>
      </Container>
    </main>
  )
}
