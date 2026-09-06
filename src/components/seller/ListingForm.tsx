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
import { catalogValue, categoryLabel, locationLabel, useLanguage } from "../../i18n"

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
  const { locale, t, tm } = useLanguage()
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
      setErrors({ name: t("form.draftName") })
      return
    }
    const quantity = parseQuantityInput(values.quantity)
    if (!values.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) {
      setErrors({ quantity: t("form.wholeQty") })
      return
    }
    setBusy("draft")
    try {
      const saved = await persist("draft")
      onDraftSaved(saved)
    } catch (error) {
      setErrors({ form: error instanceof Error ? tm(error.message, "form.unableDraft") : t("form.unableDraft") })
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
      setErrors({ name: t("form.saveName") })
      return
    } else {
      const quantity = parseQuantityInput(values.quantity)
      if (!values.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) {
        setErrors({ quantity: t("form.wholeQty") })
        return
      }
      setErrors({})
    }
    setBusy("save")
    try {
      const saved = await persist(listing?.status ?? "draft")
      onSaved?.(saved)
    } catch (error) {
      setErrors({ form: error instanceof Error ? tm(error.message, "form.unableSave") : t("form.unableSave") })
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
      setErrors({ form: error instanceof Error ? tm(error.message, "form.unableSave") : t("form.unableSave") })
    } finally {
      setBusy(null)
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void (mode === "edit" ? handleSaveChanges(event) : handlePreview(event))}>
      <Section title={t("form.basicInfo")}>
        <Field label={t("form.motorcycleName")} htmlFor="listing-name" error={errors.name ? tm(errors.name) : undefined}>
          <AuthInput
            id="listing-name"
            value={values.name}
            invalid={Boolean(errors.name)}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>
        <Field label={t("listing.category")} htmlFor="listing-category" error={errors.category ? tm(errors.category) : undefined}>
          <AuthSelect
            id="listing-category"
            value={values.category}
            invalid={Boolean(errors.category)}
            onChange={(event) => update("category", event.target.value as ListingFormValues["category"])}
          >
            <option value="">{t("form.selectCategory")}</option>
            {MOTORCYCLE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabel(locale, item)}
              </option>
            ))}
          </AuthSelect>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("listing.brand")} htmlFor="listing-brand" error={errors.brand ? tm(errors.brand) : undefined}>
            <AuthInput
              id="listing-brand"
              value={values.brand}
              invalid={Boolean(errors.brand)}
              onChange={(event) => update("brand", event.target.value)}
            />
          </Field>
          <Field label={t("listing.model")} htmlFor="listing-model" error={errors.model ? tm(errors.model) : undefined}>
            <AuthInput
              id="listing-model"
              value={values.model}
              invalid={Boolean(errors.model)}
              onChange={(event) => update("model", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title={t("form.priceCondition")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("listing.price")}
            htmlFor="listing-price"
            error={errors.price ? tm(errors.price) : undefined}
            hint={Number.isFinite(priceNumber) && priceNumber > 0 ? formatIDR(priceNumber) : t("form.priceHint")}
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
            label={t("checkout.quantity")}
            htmlFor="listing-quantity"
            error={errors.quantity ? tm(errors.quantity) : undefined}
            hint={t("form.qtyHint")}
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
        <Field label={t("listing.condition")} htmlFor="listing-condition" error={errors.condition ? tm(errors.condition) : undefined}>
          <AuthSelect
            id="listing-condition"
            value={values.condition}
            invalid={Boolean(errors.condition)}
            onChange={(event) => update("condition", event.target.value as ListingFormValues["condition"])}
          >
            <option value="">{t("form.selectCondition")}</option>
            {LISTING_CONDITIONS.map((item) => (
              <option key={item} value={item}>
                {catalogValue(locale, item)}
              </option>
            ))}
          </AuthSelect>
        </Field>
      </Section>

      <Section title={t("form.specs")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("listing.year")} htmlFor="listing-year" error={errors.year ? tm(errors.year) : undefined}>
            <AuthInput
              id="listing-year"
              inputMode="numeric"
              value={values.year}
              invalid={Boolean(errors.year)}
              onChange={(event) => update("year", event.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label={t("listing.mileage")} htmlFor="listing-mileage" error={errors.mileage ? tm(errors.mileage) : undefined} hint={t("form.kilometers")}>
            <AuthInput
              id="listing-mileage"
              inputMode="numeric"
              value={values.mileage}
              invalid={Boolean(errors.mileage)}
              onChange={(event) => update("mileage", event.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label={t("listing.engine")} htmlFor="listing-engine" error={errors.engine ? tm(errors.engine) : undefined} hint={t("form.engineHint")}>
            <AuthInput
              id="listing-engine"
              value={values.engine}
              invalid={Boolean(errors.engine)}
              onChange={(event) => update("engine", event.target.value)}
            />
          </Field>
          <Field label={t("listing.transmission")} htmlFor="listing-transmission" error={errors.transmission ? tm(errors.transmission) : undefined}>
            <AuthSelect
              id="listing-transmission"
              value={values.transmission}
              invalid={Boolean(errors.transmission)}
              onChange={(event) => update("transmission", event.target.value as ListingFormValues["transmission"])}
            >
              <option value="">{t("form.selectTransmission")}</option>
              {LISTING_TRANSMISSIONS.map((item) => (
                <option key={item} value={item}>
                  {catalogValue(locale, item)}
                </option>
              ))}
            </AuthSelect>
          </Field>
          <Field label={t("listing.fuel")} htmlFor="listing-fuel" error={errors.fuel ? tm(errors.fuel) : undefined}>
            <AuthSelect
              id="listing-fuel"
              value={values.fuel}
              invalid={Boolean(errors.fuel)}
              onChange={(event) => update("fuel", event.target.value as ListingFormValues["fuel"])}
            >
              {LISTING_FUELS.map((item) => (
                <option key={item} value={item}>
                  {catalogValue(locale, item)}
                </option>
              ))}
            </AuthSelect>
          </Field>
          <Field label={t("listing.color")} htmlFor="listing-color" error={errors.color ? tm(errors.color) : undefined}>
            <AuthInput
              id="listing-color"
              value={values.color}
              invalid={Boolean(errors.color)}
              onChange={(event) => update("color", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title={t("listing.location")}>
        <Field label={t("orders.city")} htmlFor="listing-city" error={errors.city ? tm(errors.city) : undefined}>
          <AuthSelect
            id="listing-city"
            value={values.city}
            invalid={Boolean(errors.city)}
            onChange={(event) => update("city", event.target.value)}
          >
            <option value="">{t("form.selectCity")}</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>
                {locationLabel(locale, item)}
              </option>
            ))}
          </AuthSelect>
        </Field>
        <Field label={t("form.locationArea")} htmlFor="listing-area" error={errors.location ? tm(errors.location) : undefined}>
          <AuthInput
            id="listing-area"
            value={values.location}
            invalid={Boolean(errors.location)}
            onChange={(event) => update("location", event.target.value)}
          />
        </Field>
        <Field label={t("seller.showroomAddress")} htmlFor="listing-showroom" error={errors.showroomAddress ? tm(errors.showroomAddress) : undefined}>
          <AuthInput
            id="listing-showroom"
            value={values.showroomAddress}
            invalid={Boolean(errors.showroomAddress)}
            onChange={(event) => update("showroomAddress", event.target.value)}
          />
        </Field>
      </Section>

      <Section title={t("listing.description")}>
        <Field
          label={t("form.describe")}
          htmlFor="listing-description"
          error={errors.description ? tm(errors.description) : undefined}
          hint={t("form.describeHint")}
        >
          <AuthTextarea
            id="listing-description"
            value={values.description}
            invalid={Boolean(errors.description)}
            onChange={(event) => update("description", event.target.value)}
          />
        </Field>
      </Section>

      <Section title={t("form.photos")}>
        <ListingPhotoField
          images={values.images}
          error={errors.images}
          onChange={(images) => update("images", images)}
        />
      </Section>

      {errors.form ? (
        <p className="text-sm text-red-700" role="alert">
          {tm(errors.form)}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {mode === "edit" ? (
          <Button type="submit" disabled={Boolean(busy)}>
            {busy === "save" ? t("form.saving") : t("form.saveChanges")}
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={() => void handleDraft()} disabled={Boolean(busy)}>
              {busy === "draft" ? t("form.saving") : t("form.saveDraft")}
            </Button>
            <Button type="submit" disabled={Boolean(busy)}>
              {busy === "preview" ? t("form.saving") : t("form.previewListing")}
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
