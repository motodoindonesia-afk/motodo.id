import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
}

export function Container({ children, className = "" }: Props) {
  return (
    <div className={`mx-auto w-full min-w-0 max-w-[1320px] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}
