import { EmptyState } from "./EmptyState"

export function GateLoading({ message }: { message: string }) {
  const marketplace =
    typeof document !== "undefined" && document.documentElement.classList.contains("motodo-app")

  if (marketplace) {
    return (
      <main className="bg-white py-16">
        <div className="mx-auto max-w-md px-5">
          <EmptyState title={message} />
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white py-16">
      <p className="text-center text-sm text-navy-muted">{message}</p>
    </main>
  )
}
