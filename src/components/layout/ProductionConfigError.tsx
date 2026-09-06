import { Container } from "../layout/Container"

export function ProductionConfigError({ product = "Motodo" }: { product?: string }) {
  return (
    <main className="bg-white py-16 sm:py-20">
      <Container className="max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-navy">Configuration required</h1>
        <p className="mt-3 text-navy-muted">
          {product} is not configured for this environment. Set the public Supabase URL and anon key in the host
          build settings, then rebuild. Mock marketplace mode is not available in production.
        </p>
      </Container>
    </main>
  )
}
