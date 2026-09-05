import { useState, type FormEvent, type ReactNode } from "react"
import { BUSINESS_TYPES, type BusinessType } from "../../types/seller"
import {
  emptySellerForm,
  validateSellerForm,
  type SellerFormErrors,
  type SellerFormValues,
} from "../../lib/sellerForm"
import { AuthInput, AuthSelect, AuthTextarea, Field } from "../auth/AuthField"
import { Button } from "../ui/Button"

type Props = {
  initial: Partial<SellerFormValues>
  submitLabel: string
  loadingLabel: string
  onSubmit: (values: SellerFormValues) => Promise<void>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function SellerRegistrationForm({ initial, submitLabel, loadingLabel, onSubmit }: Props) {
  const [values, setValues] = useState<SellerFormValues>(() => emptySellerForm(initial))
  const [errors, setErrors] = useState<SellerFormErrors>({})
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)

  function update<K extends keyof SellerFormValues>(key: K, value: SellerFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError("")
    const nextErrors = validateSellerForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save seller registration.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Section title="Contact Information">
        <Field label="Full Name" htmlFor="seller-name" error={errors.fullName}>
          <AuthInput
            id="seller-name"
            value={values.fullName}
            invalid={Boolean(errors.fullName)}
            onChange={(event) => update("fullName", event.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="seller-email" hint="Email is taken from your Motodo account.">
          <AuthInput id="seller-email" value={values.email} readOnly disabled className="bg-surface" />
        </Field>
        <Field label="Phone / WhatsApp" htmlFor="seller-phone" error={errors.phone}>
          <AuthInput
            id="seller-phone"
            value={values.phone}
            invalid={Boolean(errors.phone)}
            placeholder="08xxxxxxxxxx"
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Business Information">
        <Field label="Business / Garage Name" htmlFor="seller-business" error={errors.businessName}>
          <AuthInput
            id="seller-business"
            value={values.businessName}
            invalid={Boolean(errors.businessName)}
            placeholder="Jakarta Custom Garage"
            onChange={(event) => update("businessName", event.target.value)}
          />
        </Field>
        <Field label="Business Type" htmlFor="seller-type" error={errors.businessType}>
          <AuthSelect
            id="seller-type"
            value={values.businessType}
            invalid={Boolean(errors.businessType)}
            onChange={(event) => update("businessType", event.target.value as BusinessType | "")}
          >
            <option value="">Select business type</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </AuthSelect>
        </Field>
        <Field
          label="NIB"
          htmlFor="seller-nib"
          error={errors.nib}
          hint="Nomor Induk Berusaha. Entered as text for now — no government verification yet."
        >
          <AuthInput
            id="seller-nib"
            value={values.nib}
            invalid={Boolean(errors.nib)}
            placeholder="13-digit NIB"
            onChange={(event) => update("nib", event.target.value)}
          />
        </Field>
        <Field label="Year Established" htmlFor="seller-year" error={errors.yearEstablished}>
          <AuthInput
            id="seller-year"
            inputMode="numeric"
            value={values.yearEstablished}
            invalid={Boolean(errors.yearEstablished)}
            placeholder="e.g. 2018"
            onChange={(event) => update("yearEstablished", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Showroom Information">
        <p className="text-sm leading-relaxed text-navy-muted">
          Motodo sellers should have a physical showroom or business location where buyers can view motorcycles.
        </p>
        <Field label="City" htmlFor="seller-city" error={errors.city}>
          <AuthInput
            id="seller-city"
            value={values.city}
            invalid={Boolean(errors.city)}
            placeholder="Jakarta Selatan"
            onChange={(event) => update("city", event.target.value)}
          />
        </Field>
        <Field label="Showroom Address" htmlFor="seller-address" error={errors.showroomAddress}>
          <AuthTextarea
            id="seller-address"
            value={values.showroomAddress}
            invalid={Boolean(errors.showroomAddress)}
            placeholder="Street, number, and area"
            onChange={(event) => update("showroomAddress", event.target.value)}
          />
        </Field>
        <Field label="Postal Code" htmlFor="seller-postal" error={errors.postalCode}>
          <AuthInput
            id="seller-postal"
            inputMode="numeric"
            value={values.postalCode}
            invalid={Boolean(errors.postalCode)}
            placeholder="12345"
            onChange={(event) => update("postalCode", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Online Presence">
        <Field label="Instagram" htmlFor="seller-instagram" optional error={errors.instagram}>
          <AuthInput
            id="seller-instagram"
            value={values.instagram}
            placeholder="@yourgarage"
            onChange={(event) => update("instagram", event.target.value)}
          />
        </Field>
        <Field label="Website" htmlFor="seller-website" optional error={errors.website}>
          <AuthInput
            id="seller-website"
            value={values.website}
            placeholder="https://yourgarage.id"
            onChange={(event) => update("website", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="About the Business">
        <Field
          label="Tell buyers about your garage or business."
          htmlFor="seller-about"
          error={errors.description}
          hint="Include specialization, brands, custom work, experience, and services."
        >
          <AuthTextarea
            id="seller-about"
            value={values.description}
            invalid={Boolean(errors.description)}
            placeholder="We specialize in Harley-Davidson customs, restorations, and dealer-quality servicing."
            onChange={(event) => update("description", event.target.value)}
          />
        </Field>
      </Section>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full py-3 sm:w-auto" disabled={loading}>
        {loading ? loadingLabel : submitLabel}
      </Button>
    </form>
  )
}
