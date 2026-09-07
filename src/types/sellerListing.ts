/**
 * Seller listing module. Domain type is Listing in listing.ts.
 * MotorcycleListing is an alias so existing seller UI imports keep compiling.
 */
export {
  LISTING_CITIES,
  LISTING_CONDITIONS,
  LISTING_FUELS,
  LISTING_STATUSES,
  LISTING_TRANSMISSIONS,
} from "./listing"
export type {
  Listing,
  ListingCity,
  ListingCondition,
  ListingFuel,
  ListingInput,
  ListingStatus,
  ListingTransmission,
} from "./listing"

import type { Listing, ListingInput, ListingStatus } from "./listing"

export type MotorcycleListing = Listing
export type MotorcycleListingInput = ListingInput
export type SellerListingStatus = ListingStatus
