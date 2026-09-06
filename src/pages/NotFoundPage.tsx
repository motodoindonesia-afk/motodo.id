import { Bike } from "lucide-react"
import { Link } from "react-router-dom"
import { Container } from "../components/layout/Container"
import { EmptyState } from "../components/ui/EmptyState"
import { useT } from "../i18n"

export function NotFoundPage() {
  const t = useT()
  return (
    <main className="bg-white py-16 sm:py-20">
      <Container className="max-w-xl">
        <EmptyState
          icon={<Bike className="size-10" aria-hidden="true" />}
          title={t("common.notFound")}
          body={t("common.notFoundBody")}
          action={
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
              >
                {t("common.backHome")}
              </Link>
              <Link to="/browse" className="inline-flex text-sm font-medium text-brand hover:text-brand-hover">
                {t("common.browseMotorcycles")}
              </Link>
            </div>
          }
        />
      </Container>
    </main>
  )
}
