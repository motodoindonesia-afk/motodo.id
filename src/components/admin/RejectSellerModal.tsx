import { useState } from "react"
import { Button } from "../ui/Button"
import { AuthTextarea, Field } from "../auth/AuthField"

type Props = {
  businessName: string
  onCancel: () => void
  onConfirm: (reason: string) => Promise<void>
}

export function RejectSellerModal({ businessName, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!reason.trim()) {
      setError("Reason for rejection is required.")
      return
    }
    setLoading(true)
    try {
      await onConfirm(reason.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy/30" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        className="relative z-10 mx-4 w-full max-w-md rounded-t-2xl bg-white px-6 py-6 sm:rounded-2xl"
      >
        <h2 id="reject-title" className="text-lg font-bold text-navy">
          Reject Seller Registration
        </h2>
        <p className="mt-2 text-sm text-navy-muted">{businessName}</p>
        <div className="mt-4">
          <Field label="Reason for rejection" htmlFor="reject-reason" error={error}>
            <AuthTextarea
              id="reject-reason"
              value={reason}
              invalid={Boolean(error)}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-800"
            onClick={() => void handleReject()}
            disabled={loading}
          >
            {loading ? "Rejecting..." : "Reject Seller"}
          </Button>
        </div>
      </div>
    </div>
  )
}
