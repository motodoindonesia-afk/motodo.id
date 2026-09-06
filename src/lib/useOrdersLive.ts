import { useEffect, useState } from "react"
import { subscribeOrderUpdates } from "./orders"

export function useOrdersLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeOrderUpdates(() => setVersion((value) => value + 1))
  }, [])

  return version
}
