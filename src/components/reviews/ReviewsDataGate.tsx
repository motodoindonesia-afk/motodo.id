import type { ReactNode } from "react"
import { isReviewsReady } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { GateLoading } from "../ui/GateLoading"
import { useT } from "../../i18n"

export function ReviewsDataGate({ children }: { children: ReactNode }) {
  useReviewsLive()
  const t = useT()
  if (!isReviewsReady()) {
    return <GateLoading message={t("common.loading")} />
  }
  return children
}
