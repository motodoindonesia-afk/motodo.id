import { ConfirmListingModal } from "./ConfirmListingModal"
import { useT } from "../../i18n"

type Props = {
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function DeleteListingModal({ onCancel, onConfirm }: Props) {
  const t = useT()
  return (
    <ConfirmListingModal
      title={t("seller.deleteTitle")}
      message={t("seller.deleteBody")}
      confirmLabel={t("seller.deleteConfirm")}
      destructive
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
