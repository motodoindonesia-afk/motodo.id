import { useEffect } from "react"
import { X } from "lucide-react"
import type { MotorcycleListing } from "../../types/marketplace"
import { Button } from "../ui/Button"

type Props = {
  listing: MotorcycleListing
  onClose: () => void
}

export function ContactSellerModal({ listing, onClose }: Props) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close contact panel"
        className="absolute inset-0 bg-navy/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-seller-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white px-6 py-6 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="contact-seller-title" className="text-lg font-bold text-navy">
              Contact Seller
            </h2>
            <p className="mt-1 text-sm text-navy-muted">
              {listing.seller.name} · {listing.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy hover:bg-surface"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed text-navy-muted">
          Messaging is not connected yet. Use this panel as a preview — seller chat will be added in a later version.
        </p>

        <div className="mt-5 space-y-3 text-sm text-navy">
          <p>
            <span className="text-navy-muted">Seller</span>
            <br />
            <span className="font-medium">{listing.seller.name}</span>
          </p>
          <p>
            <span className="text-navy-muted">Location</span>
            <br />
            <span className="font-medium">{listing.seller.location}</span>
          </p>
        </div>

        <Button className="mt-6 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
