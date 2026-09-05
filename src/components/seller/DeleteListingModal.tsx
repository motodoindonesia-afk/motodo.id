import { ConfirmListingModal } from "./ConfirmListingModal"

type Props = {
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function DeleteListingModal({ onCancel, onConfirm }: Props) {
  return (
    <ConfirmListingModal
      title="Delete Listing?"
      message="Are you sure you want to delete this motorcycle listing? This action cannot be undone."
      confirmLabel="Delete Listing"
      destructive
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
