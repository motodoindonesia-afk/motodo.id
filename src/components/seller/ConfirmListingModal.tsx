import { Button } from "../ui/Button"

type Props = {
  title: string
  message: string
  confirmLabel: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}

export function ConfirmListingModal({
  title,
  message,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy/30" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-listing-title"
        className="relative z-10 mx-4 w-full max-w-md rounded-t-2xl bg-white px-6 py-6 sm:rounded-2xl"
      >
        <h2 id="confirm-listing-title" className="text-lg font-bold text-navy">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-muted">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className={destructive ? "bg-red-700 hover:bg-red-800" : undefined}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
