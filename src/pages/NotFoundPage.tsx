import { Link } from "react-router-dom"
import { Container } from "../components/layout/Container"

export function NotFoundPage() {
  return (
    <main className="bg-white py-16 sm:py-20">
      <Container className="max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-navy">Page Not Found</h1>
        <p className="mt-3 text-navy-muted">
          This page does not exist or the link is incorrect.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Back to Home
          </Link>
          <Link to="/browse" className="inline-flex text-sm font-medium text-brand hover:text-brand-hover">
            Browse Motorcycles
          </Link>
        </div>
      </Container>
    </main>
  )
}
