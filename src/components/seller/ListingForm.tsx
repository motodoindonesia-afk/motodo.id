import { useState, type FormEvent, type ReactNode } from "react"
import type { SellerProfile } from "../../types/seller"
import type { MotorcycleListing } from "../../types/sellerListing"
import {
  emptyListingForm,
  formatIDR,
  parsePriceInput,
  parseQuantityInput,
  validateListingForm,
  valuesToListingInput,
  type ListingFormErrors,
  type ListingFormValues,
  LISTING_CITIES,
  LISTING_CONDITIONS,
  LISTING_FUELS,
  LISTING_TRANSMISSIONS,
  MOTORCYCLE_CATEGORIES,
} from "../../lib/listingForm"
import { createListing, getListingById, updateListing } from "../../lib/listings"
import { AuthInput, AuthSelect, AuthTextarea, Field } from "../auth/AuthField"
import { ListingPhotoField } from "./ListingPhotoField"
import { Button } from "../ui/Button"

type Props = {
  profile: SellerProfile
  listing?: MotorcycleListing | null
  mode?: "create" | "edit"
  onDraftSaved: (listing: MotorcycleListing) => void
  onPreview: (listing: MotorcycleListing) => void
  onSaved?: (listing: MotorcycleListing) => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function ListingForm({ profile, listing, mode = "create", onDraftSaved, onPreview, onSaved }: Props) {
  const [values, setValues] = useState<ListingFormValues>(() => emptyListingForm(profile, listing))
  const [errors, setErrors] = useState<ListingFormErrors>({})
  const [savedId, setSavedId] = useState(listing?.id)
  const [busy, setBusy] = useState<"draft" | "preview" | "save" | null>(null)

  const cityOptions = [...new Set([profile.city, ...LISTING_CITIES].filter(Boolean))]
  const priceNumber = parsePriceInput(values.price)

  function update<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function persist(status: MotorcycleListing["status"]) {
    const stored = savedId ? getListingById(savedId) : listing ?? null
    const nextStatus = stored?.status ?? status
    const input = valuesToListingInput(values, profile.userId, nextStatus)
    if (savedId) {
      return updateListing(
        {
          ...input,
          id: savedId,
          createdAt: listing?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        profile.userId,
      )
    }
    const created = await createListing(input)
    setSavedId(created.id)
    return created
  }

  async function handleDraft() {
    setErrors({})
    if (!values.name.trim()) {
      setErrors({ name: "Add a motorcycle name before saving a draft." })
      return
    }
    const quantity = parseQuantityInput(values.quantity)
    if (!values.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) {
      setErrors({ quantity: "Enter a whole number of 1 or more." })
      return
    }
    setBusy("draft")
    try {
      const saved = await persist("draft")
      onDraftSaved(saved)
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to save draft." })
    } finally {
      setBusy(null)
    }
  }

  async function handleSaveChanges(event: FormEvent) {
    event.preventDefault()
    const requireComplete = listing?.status !== "draft"
    const nextErrors = validateListingForm(values, { requireImages: requireComplete })
    if (requireComplete) {
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return
    } else if (!values.name.trim()) {
      setErrors({ name: "Add a motorcycle name before saving." })
      return
    } else {
      const quantity = parseQuantityInput(values.quantity)
      if (!values.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) {
        setErrors({ quantity: "Enter a whole number of 1 or more." })
        return
      }
      setErrors({})
    }
    setBusy("save")
    try {
      const saved = await persist(listing?.status ?? "draft")
      onSaved?.(saved)
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to save listing." })
    } finally {
      setBusy(null)
    }
  }

  async function handlePreview(event?: FormEvent) {
    event?.preventDefault()
    const nextErrors = validateListingForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setBusy("preview")
    try {
      const saved = await persist(listing?.status === "active" || listing?.status === "sold" ? listing.status : "draft")
      onPreview(saved)
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to save listing." })
    } finally {
      setBusy(null)
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void (mode === "edit" ? handleSaveChanges(event) : handlePreview(event))}>
      <Section title="Basic Information">
        <Field label="Motorcycle Name" htmlFor="listing-name" error={errors.name}>
          <AuthInput
            id="listing-name"
            value={values.name}
            invalid={Boolean(errors.name)}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>
        <Field label="Category" htmlFor="listing-category" error={errors.category}>
          <AuthSelect
            id="listing-category"
            value={values.category}
            invalid={Boolean(errors.category)}
            onChange={(event) => update("category", event.target.value as ListingFormValues["category"])}
          >
            <option value="">Select category</option>
            {MOTORCYCLE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </AuthSelect>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand" htmlFor="listing-brand" error={errors.brand}>
            <AuthInput
              id="listing-brand"
              value={values.brand}
              invalid={Boolean(errors.brand)}
              onChange={(event) => update("brand", event.target.value)}
            />
          </Field>
          <Field label="Model" htmlFor="listing-model" error={errors.model}>
            <AuthInput
              id="listing-model"
              value={values.model}
              invalid={Boolean(errors.model)}
              onChange={(event) => update("model", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Price & Condition">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Price"
            htmlFor="listing-price"
            error={errors.price}
            hint={Number.isFinite(priceNumber) && priceNumber > 0 ? formatIDR(priceNumber) : "Enter the asking price in Indonesian Rupiah."}
          >
            <AuthInput
              id="listing-price"
              inputMode="numeric"
              value={values.price}
              invalid={Boolean(errors.price)}
              onChange={(event) => update("price", event.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field
            label="Quantity"
            htmlFor="listing-quantity"
            error={errors.quantity}
            hint="Number of units available"
          >
            <AuthInput
              id="listing-quantity"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={values.quantity}
              invalid={Boolean(errors.quantity)}
              onChange={(event) => update("quantity", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Condition" htmlFor="listing-condition" error={errors.condition}>
          <AuthSelect
            id="listing-condition"
            value={values.condition}
            invalid={Boolean(errors.condition)}
            onChange={(event) => update("condition", event.target.value as ListingFormValues["condition"])}
          >
            <option value="">Select condition</option>
            {LISTING_CONDITIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </AuthSelect>
        </Field>
      </Section>

      <Section title="Motorcycle Specifications">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Year" htmlFor="listing-year" error={errors.year}>
            <AuthInput
              id="listing-year"
              inputMode="numeric"
              value={values.year}
              invalid={Boolean(errors.year)}
              onChange={(event) => update("year", event.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label="Mileage" htmlFor="listing-mileage" error={errors.mileage} hint="Kilometers">
            <AuthInput
              id="listing-mileage"
              inputMode="numeric"
              value={values.mileage}
              invalid={Boolean(errors.mileage)}
              onChange={(event) => update("mileage", event.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label="Engine" htmlFor="listing-engine" error={errors.engine} hint="Example: 1200 cc">
            <AuthInput
              id="listing-engine"
              value={values.engine}
              invalid={Boolean(errors.engine)}
              onChange={(event) => update("engine", event.target.value)}
            />
          </Field>
          <Field label="Transmission" htmlFor="listing-transmission" error={errors.transmission}>
            <AuthSelect
              id="listing-transmission"
              value={values.transmission}
              invalid={Boolean(errors.transmission)}
              onChange={(event) => update("transmission", event.target.value as ListingFormValues["transmission"])}
            >
              <option value="">Select transmission</option>
              {LISTING_TRANSMISSIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AuthSelect>
          </Field>
          <Field label="Fuel" htmlFor="listing-fuel" error={errors.fuel}>
            <AuthSelect
              id="listing-fuel"
              value={values.fuel}
              invalid={Boolean(errors.fuel)}
              onChange={(event) => update("fuel", event.target.value as ListingFormValues["fuel"])}
            >
              {LISTING_FUELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AuthSelect>
          </Field>
          <Field label="Color" htmlFor="listing-color" error={errors.color}>
            <AuthInput
              id="listing-color"
              value={values.color}
              invalid={Boolean(errors.color)}
              onChange={(event) => update("color", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <Field label="City" htmlFor="listing-city" error={errors.city}>
          <AuthSelect
            id="listing-city"
            value={values.city}
            invalid={Boolean(errors.city)}
            onChange={(event) => update("city", event.target.value)}
          >
            <option value="">Select city</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </AuthSelect>
        </Field>
        <Field label="Location / Area" htmlFor="listing-area" error={errors.location}>
          <AuthInput
            id="listing-area"
            value={values.location}
            invalid={Boolean(errors.location)}
            onChange={(event) => update("location", event.target.value)}
          />
        </Field>
        <Field label="Showroom Address" htmlFor="listing-showroom" error={errors.showroomAddress}>
          <AuthInput
            id="listing-showroom"
            value={values.showroomAddress}
            invalid={Boolean(errors.showroomAddress)}
            onChange={(event) => update("showroomAddress", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Description">
        <Field
          label="Describe your motorcycle"
          htmlFor="listing-description"
          error={errors.description}
          hint="Mention condition, modifications, service history, ownership, notable features, and any defects."
        >
          <AuthTextarea
            id="listing-description"
            value={values.description}
            invalid={Boolean(errors.description)}
            onChange={(event) => update("description", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Photos">
        <ListingPhotoField
          images={values.images}
          error={errors.images}
          onChange={(images) => update("images", images)}
        />
      </Section>

      {errors.form ? (
        <p className="text-sm text-red-700" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {mode === "edit" ? (
          <Button type="submit" disabled={Boolean(busy)}>
            {busy === "save" ? "Saving..." : "Save Changes"}
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={() => void handleDraft()} disabled={Boolean(busy)}>
              {busy === "draft" ? "Saving..." : "Save Draft"}
            </Button>
            <Button type="submit" disabled={Boolean(busy)}>
              {busy === "preview" ? "Saving..." : "Preview Listing"}
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
