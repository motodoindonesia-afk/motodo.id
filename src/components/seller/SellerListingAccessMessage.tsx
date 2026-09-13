import { Button } from "../ui/Button"
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
    <div className="min-w-0 text-center">
      <h1 className="text-heading font-semibold tracking-tight text-navy">{title}</h1>
      <Button className="mt-6" onClick={onBack}>
        {t("seller.backListings")}
      </Button>
    </div>
  )
}
