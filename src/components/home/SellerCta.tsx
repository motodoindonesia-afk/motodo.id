import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/Button"
import { Container } from "../layout/Container"

export function SellerCta() {
  const navigate = useNavigate()

  return (
    <section id="sell" className="pb-16 sm:pb-20">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-surface px-6 py-8 sm:flex-row sm:items-center sm:px-8">
          <div>
            <h2 className="text-xl font-bold text-navy sm:text-2xl">
              Ready to sell your motorcycle?
            </h2>
            <p className="mt-2 text-sm text-navy-muted sm:text-base">
              Reach thousands of riders across Indonesia.
            </p>
          </div>
          <Button className="px-5 py-3" onClick={() => navigate("/sell")}>
            Start Selling
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </section>
  )
}
