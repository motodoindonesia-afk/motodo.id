import { Button } from "../ui/Button"
import type { ReactNode } from "react"

export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string
  description: ReactNode
  confirmLabel: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy/30" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 mx-4 w-full max-w-md rounded-t-2xl bg-white px-6 py-6 sm:rounded-2xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-navy">
          {title}
        </h2>
        <div className="mt-2 text-sm text-navy-muted">{description}</div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
