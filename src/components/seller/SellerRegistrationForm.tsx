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
import { businessTypeLabel, useLanguage } from "../../i18n"

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
  const { locale, t, tm } = useLanguage()
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
      setFormError(error instanceof Error ? tm(error.message, "reg.unable") : t("reg.unable"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Section title={t("reg.contact")}>
        <Field label={t("auth.fullName")} htmlFor="seller-name" error={errors.fullName ? tm(errors.fullName) : undefined}>
          <AuthInput
            id="seller-name"
            value={values.fullName}
            invalid={Boolean(errors.fullName)}
            onChange={(event) => update("fullName", event.target.value)}
          />
        </Field>
        <Field label={t("auth.email")} htmlFor="seller-email" hint={t("reg.emailHint")}>
          <AuthInput id="seller-email" value={values.email} readOnly disabled className="bg-surface" />
        </Field>
        <Field label={t("reg.phone")} htmlFor="seller-phone" error={errors.phone ? tm(errors.phone) : undefined}>
          <AuthInput
            id="seller-phone"
            value={values.phone}
            invalid={Boolean(errors.phone)}
            placeholder="08xxxxxxxxxx"
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>
      </Section>

      <Section title={t("reg.business")}>
        <Field label={t("reg.businessName")} htmlFor="seller-business" error={errors.businessName ? tm(errors.businessName) : undefined}>
          <AuthInput
            id="seller-business"
            value={values.businessName}
            invalid={Boolean(errors.businessName)}
            placeholder={t("reg.businessPlaceholder")}
            onChange={(event) => update("businessName", event.target.value)}
          />
        </Field>
        <Field label={t("seller.businessType")} htmlFor="seller-type" error={errors.businessType ? tm(errors.businessType) : undefined}>
          <AuthSelect
            id="seller-type"
            value={values.businessType}
            invalid={Boolean(errors.businessType)}
            onChange={(event) => update("businessType", event.target.value as BusinessType | "")}
          >
            <option value="">{t("reg.selectType")}</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {businessTypeLabel(locale, type)}
              </option>
            ))}
          </AuthSelect>
        </Field>
        <Field
          label="NIB"
          htmlFor="seller-nib"
          hint={t("reg.nibHint")}
          error={errors.nib ? tm(errors.nib) : undefined}
        >
          <AuthInput
            id="seller-nib"
            value={values.nib}
            invalid={Boolean(errors.nib)}
            placeholder={t("reg.nibPlaceholder")}
            onChange={(event) => update("nib", event.target.value)}
          />
        </Field>
        <Field label={t("reg.yearEstablished")} htmlFor="seller-year" error={errors.yearEstablished ? tm(errors.yearEstablished) : undefined}>
          <AuthInput
            id="seller-year"
            inputMode="numeric"
            value={values.yearEstablished}
            invalid={Boolean(errors.yearEstablished)}
            placeholder={t("reg.yearPlaceholder")}
            onChange={(event) => update("yearEstablished", event.target.value)}
          />
        </Field>
      </Section>

      <Section title={t("reg.showroom")}>
        <p className="text-sm leading-relaxed text-navy-muted">
          {t("reg.showroomBody")}
        </p>
        <Field label={t("orders.city")} htmlFor="seller-city" error={errors.city ? tm(errors.city) : undefined}>
          <AuthInput
            id="seller-city"
            value={values.city}
            invalid={Boolean(errors.city)}
            placeholder={t("reg.cityPlaceholder")}
            onChange={(event) => update("city", event.target.value)}
          />
        </Field>
        <Field label={t("seller.showroomAddress")} htmlFor="seller-address" error={errors.showroomAddress ? tm(errors.showroomAddress) : undefined}>
          <AuthTextarea
            id="seller-address"
            value={values.showroomAddress}
            invalid={Boolean(errors.showroomAddress)}
            placeholder={t("reg.addressPlaceholder")}
            onChange={(event) => update("showroomAddress", event.target.value)}
          />
        </Field>
        <Field label={t("reg.postal")} htmlFor="seller-postal" error={errors.postalCode ? tm(errors.postalCode) : undefined}>
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

      <Section title={t("reg.online")}>
        <Field label={t("reg.instagram")} htmlFor="seller-instagram" optional error={errors.instagram ? tm(errors.instagram) : undefined}>
          <AuthInput
            id="seller-instagram"
            value={values.instagram}
            placeholder="@yourgarage"
            onChange={(event) => update("instagram", event.target.value)}
          />
        </Field>
        <Field label={t("seller.website")} htmlFor="seller-website" optional error={errors.website ? tm(errors.website) : undefined}>
          <AuthInput
            id="seller-website"
            value={values.website}
            placeholder="https://yourgarage.id"
            onChange={(event) => update("website", event.target.value)}
          />
        </Field>
      </Section>

      <Section title={t("reg.about")}>
        <Field
          label={t("reg.aboutLabel")}
          htmlFor="seller-about"
          error={errors.description ? tm(errors.description) : undefined}
          hint={t("reg.aboutHint")}
        >
          <AuthTextarea
            id="seller-about"
            value={values.description}
            invalid={Boolean(errors.description)}
            placeholder={t("reg.aboutPlaceholder")}
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
