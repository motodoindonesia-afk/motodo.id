import { useEffect, useState } from "react"
import { subscribeNotificationUpdates } from "./notifications"

export function useNotificationsLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeNotificationUpdates(() => setVersion((value) => value + 1))
  }, [])

  return version
}
