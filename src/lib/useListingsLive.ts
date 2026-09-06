import { useEffect, useState } from "react"
import { subscribeListingUpdates } from "./listings"
import { subscribeOrderUpdates } from "./orders"

export function useListingsLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const onChange = () => setVersion((value) => value + 1)
    const stopListings = subscribeListingUpdates(onChange)
    const stopOrders = subscribeOrderUpdates(onChange)
    return () => {
      stopListings()
      stopOrders()
    }
  }, [])

  return version
}
