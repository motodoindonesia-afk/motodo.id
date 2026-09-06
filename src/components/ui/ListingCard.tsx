import type { ReactNode } from "react"
import type { MotorcycleListing } from "../../types/marketplace"
import { MotorcycleCard } from "./MotorcycleCard"

type Props = {
  listing: MotorcycleListing
  badge?: ReactNode
  footer?: ReactNode
  hideQuantity?: boolean
}

export function ListingCard({ listing, badge, footer, hideQuantity }: Props) {
  return (
    <MotorcycleCard
      listing={listing}
      href={`/motorcycles/${listing.id}`}
      badge={badge}
      footer={footer}
      hideQuantity={hideQuantity}
    />
  )
}
