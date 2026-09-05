import { Link, useParams } from "react-router-dom"
import { getMotorcycleById } from "../../data/listings"
import { Container } from "../layout/Container"

export function MotorcycleDetailPage() {
  const { id } = useParams()
  const listing = id ? getMotorcycleById(id) : undefined

  if (!listing) {
    return (
      <main className="bg-white py-16">
        <Container className="max-w-2xl">
          <h1 className="text-3xl font-bold text-navy">Motorcycle not found</h1>
          <p className="mt-3 text-navy-muted">This listing is not available yet.</p>
          <Link to="/browse" className="mt-6 inline-flex text-sm font-medium text-brand hover:text-brand-hover">
            Back to Browse
          </Link>
        </Container>
      </main>
    )
  }

  return (
    <main className="bg-white py-12 sm:py-16">
      <Container className="max-w-4xl">
        <Link to="/browse" className="text-sm font-medium text-brand hover:text-brand-hover">
          Back to Browse
        </Link>
        <div className="mt-6 overflow-hidden rounded-2xl bg-surface">
          <img src={listing.image} alt={listing.name} className="aspect-[16/10] w-full object-cover" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-navy">{listing.name}</h1>
        <p className="mt-2 text-xl font-semibold text-brand">{listing.price}</p>
        <p className="mt-4 text-sm text-navy-muted">
          {listing.year} · {listing.location} · {listing.category}
        </p>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-navy-muted">
          Full listing details will be available in a later version.
        </p>
      </Container>
    </main>
  )
}
