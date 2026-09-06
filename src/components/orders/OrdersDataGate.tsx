import type { ReactNode } from "react"
import { isOrdersReady } from "../../lib/orders"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { GateLoading } from "../ui/GateLoading"
import { useT } from "../../i18n"

export function OrdersDataGate({ children }: { children: ReactNode }) {
  useOrdersLive()
  const t = useT()
  if (!isOrdersReady()) {
    return <GateLoading message={t("common.loading")} />
  }
  return children
}
