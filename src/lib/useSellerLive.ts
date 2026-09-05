import { useEffect, useState } from "react"
import { subscribeSellerUpdates } from "./seller"

export function useSellerLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeSellerUpdates(() => setVersion((value) => value + 1))
  }, [])

  return version
}
