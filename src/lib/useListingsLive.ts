import { useEffect, useState } from "react"
import { subscribeListingUpdates } from "./listings"

export function useListingsLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeListingUpdates(() => setVersion((value) => value + 1))
  }, [])

  return version
}
