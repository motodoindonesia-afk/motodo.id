import { DEFAULT_LOCALE, isLocale, LANGUAGE_STORAGE_KEY, type Locale, type MessageKey, type TranslateVars, messages } from "./translations"

export function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* private mode */
  }
  return DEFAULT_LOCALE
}

export function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale)
  } catch {
    /* private mode */
  }
}

export function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined || vars[name] === null ? `{${name}}` : String(vars[name]),
  )
}

export function translate(locale: Locale, key: MessageKey, vars?: TranslateVars) {
  const table = messages[locale] ?? messages[DEFAULT_LOCALE]
  return interpolate(table[key] ?? messages.en[key] ?? key, vars)
}

const AUTH_ERROR_MAP: Record<string, MessageKey> = {
  "email is required.": "auth.emailRequired",
  "enter a valid email address.": "auth.emailInvalid",
  "password is required.": "auth.passwordRequired",
  "password must be at least 8 characters.": "auth.passwordShort",
  "full name is required.": "auth.nameRequired",
  "confirm your password.": "auth.confirmRequired",
  "passwords do not match.": "auth.passwordMismatch",
  "unable to log in.": "auth.unableLogin",
  "unable to continue with google.": "auth.unableGoogle",
  "this environment is not configured.": "auth.envNotConfigured",
  "incorrect email or password.": "auth.incorrect",
  "an account with this email already exists.": "auth.alreadyRegistered",
  "confirm your email before logging in.": "auth.confirmEmail",
  "google sign-in is not available right now.": "auth.googleUnavailable",
  "unable to continue with google. please try again.": "auth.googleRetry",
  "unable to authenticate.": "auth.unableAuth",
  "your account was created but the profile is not ready yet. try logging in again.": "auth.profileNotReady",
  "you must be logged in to update your profile.": "auth.mustLoginProfile",
  "profile not found.": "auth.profileNotFound",
  "unable to load your profile.": "auth.unableLoadProfile",
  "unable to update your profile.": "auth.unableUpdateProfile",
  "unable to create account.": "auth.unableCreate",
  "account created. confirm your email, then log in.": "auth.confirmThenLogin",
  "you must be logged in.": "auth.mustLoginProfile",
  "you don't have permission to do that.": "common.errorGeneric",
  "motorcycle listing not found.": "listing.notFound",
  "you cannot message yourself.": "listing.cannotChatSelf",
  "you cannot purchase your own listing.": "listing.cannotBuyOwn",
  "this motorcycle is no longer available.": "listing.unavailable",
  "select an account type.": "auth.selectAccountType",
  "quantity is required.": "checkout.qtyRequired",
  "quantity must be a whole number.": "checkout.qtyWhole",
  "quantity must be greater than 0.": "checkout.qtyMin",
  "only 1 unit left": "checkout.unitsLeftOne",
  "seller fleet is not available for this listing.": "checkout.fleetUnavailable",
  "delivery address is required.": "checkout.addressRequired",
  "city is required.": "checkout.cityRequired",
  "unable to place order.": "checkout.unablePlace",
  "you must be logged in to place an order.": "checkout.mustLogin",
  "third-party logistics is not available yet.": "checkout.thirdUnavailable",
  "select a delivery method.": "checkout.selectDelivery",
  "enter a message before sending.": "chat.enterMessage",
  "unable to send this message.": "chat.unableSend",
  "you have already reviewed this order.": "review.already",
  "unable to submit review.": "review.unable",
  "you must be logged in to leave a review.": "review.mustLogin",
  "order not found.": "orders.notFound",
  "you don't have permission to review this order.": "review.noPermission",
  "you can only review a completed order.": "review.onlyCompleted",
  "select a rating from 1 to 5 stars.": "review.selectStars",
  "comment is required.": "review.commentRequired",
  "comment must be at least 5 characters.": "review.commentShort",
  "comment must be 1000 characters or fewer.": "review.commentLong",
  "add a motorcycle name before saving a draft.": "form.draftName",
  "add a motorcycle name before saving.": "form.saveName",
  "enter a whole number of 1 or more.": "form.wholeQty",
  "unable to save draft.": "form.unableDraft",
  "unable to save listing.": "form.unableSave",
  "motorcycle name is required.": "form.nameRequired",
  "select a category.": "form.selectCategoryError",
  "brand is required.": "form.brandRequired",
  "model is required.": "form.modelRequired",
  "price is required.": "form.priceRequired",
  "enter a price greater than 0.": "form.priceMin",
  "select a condition.": "form.selectConditionError",
  "year is required.": "form.yearRequired",
  "mileage is required.": "form.mileageRequired",
  "enter mileage in kilometers.": "form.mileageKm",
  "engine is required.": "form.engineRequired",
  "select a transmission.": "form.selectTransmissionError",
  "select a fuel type.": "form.selectFuelError",
  "color is required.": "form.colorRequired",
  "location / area is required.": "form.areaRequired",
  "showroom address is required.": "form.showroomRequired",
  "description is required.": "form.descRequired",
  "add more detail so buyers understand the motorcycle.": "form.descShort",
  "add at least one photo. the first photo is the cover image.": "form.photoRequired",
  "you can add up to 10 photos.": "form.photoMax",
  "unable to add that photo.": "photo.unable",
  "unable to save seller registration.": "reg.unable",
  "phone / whatsapp is required.": "reg.phoneRequired",
  "enter a valid indonesian phone number.": "seller.phoneInvalid",
  "business / garage name is required.": "reg.businessNameRequired",
  "select a business type.": "reg.selectTypeError",
  "nib is required.": "reg.nibRequired",
  "enter a valid nib (8–16 digits).": "reg.nibInvalid",
  "year established is required.": "reg.yearRequired",
  "postal code is required.": "reg.postalRequired",
  "enter a 5-digit postal code.": "reg.postalInvalid",
  "business description is required.": "seller.descRequired",
  "enter a valid website.": "reg.websiteInvalid",
  "enter a valid website url.": "seller.websiteInvalid",
  "business name is required.": "seller.businessNameRequired",
  "unable to update seller profile.": "seller.unableUpdateProfile",
  "unable to update order.": "seller.unableUpdate",
  "you don't have permission to update this order.": "order.noPermissionUpdate",
  "this order status cannot be changed.": "order.statusLocked",
  "unable to complete this order because inventory is inconsistent.": "order.inventoryInconsistent",
}

export function translateUserMessage(locale: Locale, message: string, fallback: MessageKey = "common.errorGeneric") {
  const trimmed = message.trim()
  const mapped = AUTH_ERROR_MAP[trimmed.toLowerCase()]
  if (mapped) return translate(locale, mapped)
  const unitsLeft = trimmed.match(/^only (\d+) units left$/i)
  if (unitsLeft) return translate(locale, "checkout.unitsLeftMany", { count: unitsLeft[1] })
  const yearRange = trimmed.match(/^enter a year between 1950 and (\d+)\.$/i)
  if (yearRange) return translate(locale, "form.yearRange", { year: yearRange[1] })
  return trimmed || translate(locale, fallback)
}

export function categoryLabel(locale: Locale, category: string) {
  const key = `category.${category}` as MessageKey
  if (key in messages.en) return translate(locale, key)
  return category
}

export function locationLabel(locale: Locale, location: string) {
  const key = `location.${location}` as MessageKey
  if (key in messages.en) return translate(locale, key)
  return location
}

export function catalogValue(locale: Locale, value: string) {
  const key = `value.${value}` as MessageKey
  if (key in messages.en) return translate(locale, key)
  return value
}

export function availableQuantityLabel(locale: Locale, quantity: number) {
  if (quantity <= 0) return translate(locale, "listing.soldOut")
  if (quantity === 1) return translate(locale, "listing.availableOne")
  return translate(locale, "listing.availableMany", { count: quantity })
}

export function businessTypeLabel(locale: Locale, type: string) {
  const key = `business.${type}` as MessageKey
  if (key in messages.en) return translate(locale, key)
  return type
}

const SORT_LABELS: Record<string, MessageKey> = {
  newest: "browse.sort.newest",
  oldest: "browse.sort.oldest",
  "price-asc": "browse.sort.priceAsc",
  "price-desc": "browse.sort.priceDesc",
  "year-desc": "browse.sort.yearDesc",
  "year-asc": "browse.sort.yearAsc",
}

export function sortOptionLabel(locale: Locale, value: string) {
  const key = SORT_LABELS[value]
  return key ? translate(locale, key) : value
}
