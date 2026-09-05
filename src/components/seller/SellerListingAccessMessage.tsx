import { Button } from "../ui/Button"
import { Container } from "../layout/Container"

export function SellerListingAccessMessage({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <Button className="mt-6" onClick={onBack}>
            Back to My Listings
          </Button>
        </div>
      </Container>
    </main>
  )
}
