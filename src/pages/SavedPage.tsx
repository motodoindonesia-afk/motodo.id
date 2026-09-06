import { Heart } from "lucide-react"
import { Link } from "react-router-dom"
import { Container } from "../components/layout/Container"
import { EmptyState } from "../components/ui/EmptyState"
import { useT } from "../i18n"

export function SavedPage() {
  const t = useT()
  return (
    <main className="bg-white py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-xl">
          <EmptyState
            icon={<Heart className="size-10" aria-hidden="true" />}
            title={t("saved.motorcycles")}
            body={t("saved.soon")}
            action={
              <Link
                to="/browse"
                className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
              >
                {t("common.browseMotorcycles")}
              </Link>
            }
          />
        </div>
      </Container>
    </main>
  )
}
