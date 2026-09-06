import { useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { AuthInput, AuthTextarea, Field } from "../../components/auth/AuthField"
import { SellerNav } from "../../components/seller/SellerNav"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { getSellerProfile, updateSellerProfile } from "../../lib/seller"
import { isValidIndonesianPhone, isValidWebsite } from "../../lib/sellerForm"
import { useSellerLive } from "../../lib/useSellerLive"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function SellerProfileEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  const profile = user ? getSellerProfile(user.id) : null
  const [businessName, setBusinessName] = useState(profile?.businessName ?? "")
  const [description, setDescription] = useState(profile?.description ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [email, setEmail] = useState(profile?.email ?? "")
  const [showroomAddress, setShowroomAddress] = useState(profile?.showroomAddress ?? "")
  const [city, setCity] = useState(profile?.city ?? "")
  const [website, setWebsite] = useState(profile?.website ?? "")
  const [businessHours, setBusinessHours] = useState(profile?.businessHours ?? "")
  const [sellerFleetAvailable, setSellerFleetAvailable] = useState(Boolean(profile?.sellerFleetAvailable))
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!user) return null
  if (!profile) return <Navigate to="/profile" replace />

  const currentUser = user
  const approved = profile.status === "approved"

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    if (!businessName.trim()) {
      setError("Business name is required.")
      return
    }
    if (!description.trim()) {
      setError("Business description is required.")
      return
    }
    if (!phone.trim() || !isValidIndonesianPhone(phone)) {
      setError("Enter a valid Indonesian phone number.")
      return
    }
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError("Enter a valid email address.")
      return
    }
    if (!showroomAddress.trim()) {
      setError("Showroom address is required.")
      return
    }
    if (!city.trim()) {
      setError("City is required.")
      return
    }
    if (!isValidWebsite(website)) {
      setError("Enter a valid website URL.")
      return
    }

    setLoading(true)
    try {
      const next = await updateSellerProfile(currentUser.id, {
        businessName: businessName.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        showroomAddress: showroomAddress.trim(),
        city: city.trim(),
        website: website.trim(),
        businessHours: businessHours.trim(),
        sellerFleetAvailable,
      })
      if (!next) throw new Error("Unable to update seller profile.")
      navigate("/seller/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update seller profile.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Edit Seller Profile</h1>
            <SellerStatusBadge status={profile.status} />
          </div>
          <SellerNav approved={approved} />

          <form className="mt-8 space-y-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <Field label="Business Name" htmlFor="seller-business-name">
              <AuthInput id="seller-business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
            </Field>
            <Field label="Business Description" htmlFor="seller-description">
              <AuthTextarea id="seller-description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label="Phone Number" htmlFor="seller-phone">
              <AuthInput id="seller-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label="Email" htmlFor="seller-email">
              <AuthInput id="seller-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Showroom Address" htmlFor="seller-address">
              <AuthInput id="seller-address" value={showroomAddress} onChange={(event) => setShowroomAddress(event.target.value)} />
            </Field>
            <Field label="City" htmlFor="seller-city">
              <AuthInput id="seller-city" value={city} onChange={(event) => setCity(event.target.value)} />
            </Field>
            <Field label="Website" htmlFor="seller-website" optional>
              <AuthInput id="seller-website" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </Field>
            <Field label="Business Hours" htmlFor="seller-hours" optional>
              <AuthInput
                id="seller-hours"
                value={businessHours}
                placeholder="Mon–Sat 09.00–17.00"
                onChange={(event) => setBusinessHours(event.target.value)}
              />
            </Field>

            <div className="rounded-2xl border border-line px-5 py-5">
              <p className="text-sm font-semibold text-navy">NIB</p>
              <p className="mt-2 text-sm text-navy">{profile.nib}</p>
              {approved ? (
                <p className="mt-2 text-sm text-navy-muted">
                  Contact Motodo support to update verified business information.
                </p>
              ) : (
                <p className="mt-2 text-sm text-navy-muted">NIB can be updated from seller registration until you are approved.</p>
              )}
            </div>

            <fieldset className="rounded-2xl border border-line px-5 py-5">
              <legend className="text-sm font-semibold text-navy">Delivery Options</legend>
              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={sellerFleetAvailable}
                  onChange={(event) => setSellerFleetAvailable(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium text-navy">Seller Fleet</span>
                  <span className="mt-1 block text-sm text-navy-muted">
                    I provide delivery using my own fleet.
                  </span>
                </span>
              </label>
              <div className="mt-4 rounded-xl bg-surface px-4 py-3 opacity-70">
                <p className="text-sm font-medium text-navy">Third-Party Logistics</p>
                <p className="mt-1 text-xs text-navy-muted">Coming Soon</p>
                <p className="mt-2 text-sm text-navy-muted">
                  Third-party logistics integration will be available in a future release.
                </p>
                <label className="mt-3 flex cursor-not-allowed items-start gap-3">
                  <input type="checkbox" className="mt-1" disabled checked={false} />
                  <span className="text-sm text-navy-muted">Enable third-party logistics</span>
                </label>
              </div>
            </fieldset>

            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/seller/profile")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </main>
  )
}
