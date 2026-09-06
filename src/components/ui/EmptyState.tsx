import type { ReactNode } from "react"
import { surfaceCard } from "./surface"

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className={surfaceCard("px-5 py-12 text-center sm:px-8")}>
      {icon ? <div className="mx-auto flex justify-center text-brand">{icon}</div> : null}
      <h2 className={icon ? "mt-4 text-section font-bold text-navy" : "text-section font-bold text-navy"}>{title}</h2>
      {body ? <p className="mt-1.5 text-ui leading-relaxed text-navy-muted">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
