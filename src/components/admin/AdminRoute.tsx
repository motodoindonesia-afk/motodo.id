import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { requireAdmin } from "../../lib/admin"
import { Button } from "../ui/Button"
import { Container } from "../layout/Container"
import type { ReactNode } from "react"

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (!requireAdmin(user)) {
    return (
      <main className="bg-white py-12 sm:py-16">
        <Container>
          <div className="mx-auto max-w-lg rounded-2xl border border-line px-6 py-10 text-center">
            <h1 className="text-2xl font-bold text-navy">Access denied</h1>
            <p className="mt-3 text-sm leading-relaxed text-navy-muted">
              This area is limited to Motodo administrators.
            </p>
            <Link to="/profile">
              <Button className="mt-6">Back to My Profile</Button>
            </Link>
          </div>
        </Container>
      </main>
    )
  }

  return children
}
