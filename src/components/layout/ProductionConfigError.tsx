import { Container } from "../layout/Container"
import { useT } from "../../i18n"

export function ProductionConfigError({ product = "Motodo" }: { product?: string }) {
  const t = useT()
  return (
    <main className="bg-white py-16 sm:py-20">
      <Container className="max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-navy">{t("common.configRequired")}</h1>
        <p className="mt-3 text-navy-muted">{t("common.configBody", { product })}</p>
      </Container>
    </main>
  )
}
