import type { BusinessType } from "../types/seller"
import { BUSINESS_TYPES } from "../types/seller"

export type SellerFormValues = {
  fullName: string
  email: string
  phone: string
  businessName: string
  businessType: BusinessType | ""
  nib: string
  yearEstablished: string
  city: string
  showroomAddress: string
  postalCode: string
  instagram: string
  website: string
  description: string
}

export type SellerFormErrors = Partial<Record<keyof SellerFormValues, string>>

const currentYear = new Date().getFullYear()

export function emptySellerForm(defaults?: Partial<SellerFormValues>): SellerFormValues {
  return {
    fullName: defaults?.fullName ?? "",
    email: defaults?.email ?? "",
    phone: defaults?.phone ?? "",
    businessName: defaults?.businessName ?? "",
    businessType: defaults?.businessType ?? "",
    nib: defaults?.nib ?? "",
    yearEstablished: defaults?.yearEstablished ?? "",
    city: defaults?.city ?? "",
    showroomAddress: defaults?.showroomAddress ?? "",
    postalCode: defaults?.postalCode ?? "",
    instagram: defaults?.instagram ?? "",
    website: defaults?.website ?? "",
    description: defaults?.description ?? "",
  }
}

export function isValidIndonesianPhone(value: string) {
  const digits = value.replace(/[\s-]/g, "")
  return /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/.test(digits)
}

export function isValidNib(value: string) {
  const compact = value.replace(/\s/g, "")
  return /^\d{8,16}$/.test(compact)
}

export function isValidPostalCode(value: string) {
  return /^\d{5}$/.test(value.trim())
}

export function isValidWebsite(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return true
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(trimmed)
}

export function validateSellerForm(values: SellerFormValues): SellerFormErrors {
  const errors: SellerFormErrors = {}
  if (!values.fullName.trim()) errors.fullName = "Full name is required."
  if (!values.phone.trim()) errors.phone = "Phone / WhatsApp is required."
  else if (!isValidIndonesianPhone(values.phone)) {
    errors.phone = "Enter a valid Indonesian phone number."
  }
  if (!values.businessName.trim()) errors.businessName = "Business / garage name is required."
  if (!values.businessType || !BUSINESS_TYPES.includes(values.businessType)) {
    errors.businessType = "Select a business type."
  }
  if (!values.nib.trim()) errors.nib = "NIB is required."
  else if (!isValidNib(values.nib)) errors.nib = "Enter a valid NIB (8–16 digits)."
  if (!values.yearEstablished.trim()) errors.yearEstablished = "Year established is required."
  else {
    const year = Number(values.yearEstablished)
    if (!Number.isInteger(year) || year < 1950 || year > currentYear) {
      errors.yearEstablished = `Enter a year between 1950 and ${currentYear}.`
    }
  }
  if (!values.city.trim()) errors.city = "City is required."
  if (!values.showroomAddress.trim()) errors.showroomAddress = "Showroom address is required."
  if (!values.postalCode.trim()) errors.postalCode = "Postal code is required."
  else if (!isValidPostalCode(values.postalCode)) errors.postalCode = "Enter a 5-digit postal code."
  if (!values.description.trim()) errors.description = "Business description is required."
  if (values.website.trim() && !isValidWebsite(values.website)) {
    errors.website = "Enter a valid website."
  }
  return errors
}
