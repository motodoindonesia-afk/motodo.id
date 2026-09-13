import { Button } from "../ui/Button"

type Props = {
  orderRef: string
  loading: boolean
  error: string
  onKeep: () => void
  onConfirm: () => void
}

export function CancelOrderModal({ orderRef, loading, error, onKeep, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Keep order"
        className="absolute inset-0 bg-navy/30"
        onClick={() => {
          if (!loading) onKeep()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="relative z-10 mx-4 w-full min-w-0 max-w-md rounded-t-2xl bg-white px-6 py-6 sm:rounded-2xl"
      >
        <h2 id="cancel-order-title" className="text-lg font-bold text-navy">
          Cancel Order?
        </h2>
        <p className="mt-2 text-sm text-navy-muted">
          You are about to cancel order {orderRef}. This action cannot be undone. The order will be marked as cancelled
          and any active inventory reservation will be released.
        </p>
        {error ? (
          <p className="mt-3 text-sm text-navy" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" className="min-w-0 flex-1" onClick={onKeep} disabled={loading}>
            Keep Order
          </Button>
          <Button
            className="min-w-0 flex-1 bg-red-700 hover:bg-red-800"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Cancel Order"}
          </Button>
        </div>
      </div>
    </div>
  )
}
