import { useEffect, useState } from "react"
import { subscribeReviewUpdates } from "./reviews"

export function useReviewsLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeReviewUpdates(() => setVersion((value) => value + 1))
  }, [])

  return version
}
