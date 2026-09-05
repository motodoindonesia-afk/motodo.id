import { Container } from "../components/layout/Container"

export function SavedPage() {
  return (
    <main className="bg-white py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Saved Motorcycles</h1>
          <p className="mt-3 text-base leading-relaxed text-navy-muted">
            Saved favorites will be available soon.
          </p>
        </div>
      </Container>
    </main>
  )
}
