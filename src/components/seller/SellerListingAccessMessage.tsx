import { Button } from "../ui/Button"
import { Container } from "../layout/Container"
import { useT } from "../../i18n"

export function SellerListingAccessMessage({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  const t = useT()
  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <Button className="mt-6" onClick={onBack}>
            {t("seller.backListings")}
          </Button>
        </div>
      </Container>
    </main>
  )
}
