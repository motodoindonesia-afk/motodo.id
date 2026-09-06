import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Container } from "../../components/layout/Container"
import { Button } from "../../components/ui/Button"
import { isSupabaseConfigured } from "../../lib/supabase"
import { SELLER_SUCCESS_FEE_RATE } from "../../lib/orders"
import { OPS } from "../../lib/opsPaths"
import { privilegeLabel } from "../../lib/adminPlatform"

const APP_VERSION = "0.1.0"

export function AdminSettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const feePercent = Math.round(SELLER_SUCCESS_FEE_RATE * 100)
  const environment = import.meta.env.PROD ? "production" : "development"
  const authMode = isSupabaseConfigured() ? "Supabase Auth (profiles.role)" : "Development mock (not used in production)"

  function handleLogout() {
    logout()
    navigate(OPS.login, { replace: true })
  }

  return (
    <main className="py-8 sm:py-10">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Settings</h1>
          <p className="mt-2 text-navy-muted">Read-only operations information.</p>

          <section className="mt-8 rounded-2xl border border-line bg-white px-5 py-6">
            <h2 className="text-lg font-bold text-navy">Admin account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Name</dt>
                <dd className="font-medium text-navy">{user?.fullName ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Email</dt>
                <dd className="font-medium text-navy">{user?.email?.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Role</dt>
                <dd className="font-medium text-navy">{user ? privilegeLabel(user) : "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-line bg-white px-5 py-6">
            <h2 className="text-lg font-bold text-navy">Application</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Application name</dt>
                <dd className="font-medium text-navy">Ritme</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Product</dt>
                <dd className="font-medium text-navy">Motodo Operations</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Version</dt>
                <dd className="font-medium text-navy">{APP_VERSION}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Environment</dt>
                <dd className="font-medium text-navy">{environment}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Authentication</dt>
                <dd className="font-medium text-navy">{authMode}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Motodo Success Fee</dt>
                <dd className="font-medium text-navy">{feePercent}% of buyer total</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-navy-muted">
              Supabase configuration is set in the deployment environment. It cannot be changed from this screen.
            </p>
            <Button className="mt-6" variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </section>
        </div>
      </Container>
    </main>
  )
}
