import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/Button"
import { Container } from "../layout/Container"

export function SellerCta() {
  const navigate = useNavigate()

  return (
    <section id="sell" className="pb-10 sm:pb-12">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-surface px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-section font-bold text-navy">
              Ready to sell your motorcycle?
            </h2>
            <p className="mt-1 text-ui text-navy-muted">
              Reach thousands of riders across Indonesia.
            </p>
          </div>
          <Button className="px-4 py-2 text-ui" onClick={() => navigate("/sell")}>
            Start Selling
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </section>
  )
}
