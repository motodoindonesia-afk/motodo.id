import type { MotorcycleListing } from "../../types/marketplace"
import { MotorcycleCard } from "./MotorcycleCard"

type Props = {
  listing: MotorcycleListing
}

export function ListingCard({ listing }: Props) {
  return <MotorcycleCard listing={listing} href={`/motorcycles/${listing.id}`} />
}
