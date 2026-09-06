import type { ReactNode } from "react"
import { isListingsReady } from "../../lib/listings"
import { useListingsLive } from "../../lib/useListingsLive"
import { GateLoading } from "../ui/GateLoading"
import { useT } from "../../i18n"

export function ListingsDataGate({ children }: { children: ReactNode }) {
  useListingsLive()
  const t = useT()
  if (!isListingsReady()) {
    return <GateLoading message={t("common.loading")} />
  }
  return children
}
