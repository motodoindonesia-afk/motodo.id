import type { ReactNode } from "react"
import { Container } from "../layout/Container"

type Props = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <main className="bg-white py-12 sm:py-16">
      <Container>
        <div className="mx-auto w-full max-w-[440px]">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{title}</h1>
          <p className="mt-2 text-base text-navy-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </Container>
    </main>
  )
}
