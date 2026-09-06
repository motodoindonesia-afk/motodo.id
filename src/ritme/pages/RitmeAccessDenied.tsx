import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { OPS } from "../../lib/opsPaths"
import { Button } from "../../components/ui/Button"

export function RitmeAccessDenied() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    logout()
    navigate(OPS.login, { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-5">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white px-6 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-muted">Ritme</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-navy">Access denied.</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-muted">
          Your account does not have permission to access Ritme.
        </p>
        {user ? (
          <p className="mt-2 text-xs text-navy-muted">Signed in as {user.fullName}.</p>
        ) : null}
        <Button className="mt-6 w-full" onClick={handleSignOut}>
          Return to login
        </Button>
      </div>
    </main>
  )
}
