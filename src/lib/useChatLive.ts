import { useEffect, useState } from "react"
import { subscribeChatUpdates } from "./chat"

export function useChatLive() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeChatUpdates(() => setVersion((value) => value + 1))
  }, [])

  return version
}
