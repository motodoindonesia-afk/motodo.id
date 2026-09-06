import { useEffect, useState } from "react"
import { subscribeAdminUsersUpdates } from "./adminUsersSupabase"

export function useAdminUsersLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeAdminUsersUpdates(() => setVersion((value) => value + 1))
  }, [])

  return version
}
