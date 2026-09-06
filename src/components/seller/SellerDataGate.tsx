import type { ReactNode } from "react"
import { isSellerProfilesReady } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"
import { GateLoading } from "../ui/GateLoading"
import { useT } from "../../i18n"

export function SellerDataGate({ children }: { children: ReactNode }) {
  useSellerLive()
  const t = useT()
  if (!isSellerProfilesReady()) {
    return <GateLoading message={t("common.loading")} />
  }
  return children
}
