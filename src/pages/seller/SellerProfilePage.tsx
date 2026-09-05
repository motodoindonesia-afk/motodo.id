import { useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile, updateSellerProfile } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"
import type { SellerFormValues } from "../../lib/sellerForm"
import { SellerRegistrationForm } from "../../components/seller/SellerRegistrationForm"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-navy-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value || "—"}</dd>
    </div>
  )
}

export function SellerProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [editing, setEditing] = useState(searchParams.get("edit") === "1")
  const [success, setSuccess] = useState("")
  useSellerLive()
  const profile = user ? getSellerProfile(user.id) : null

  if (!user) return null
  if (!profile) return <Navigate to="/seller/register" replace />

  async function handleSubmit(values: SellerFormValues) {
    if (!user) return
    const next = await updateSellerProfile(user.id, {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      businessName: values.businessName.trim(),
      businessType: values.businessType === "" ? "Other" : values.businessType,
      nib: values.nib.replace(/\s/g, ""),
      yearEstablished: Number(values.yearEstablished),
      city: values.city.trim(),
      showroomAddress: values.showroomAddress.trim(),
      postalCode: values.postalCode.trim(),
      instagram: values.instagram.trim(),
      website: values.website.trim(),
      description: values.description.trim(),
    })
    if (!next) throw new Error("Unable to update seller profile.")
    updateProfile({ fullName: values.fullName.trim() })
    setEditing(false)
    setSuccess("Seller profile updated.")
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Profile</h1>
            <SellerStatusBadge status={profile.status} />
          </div>
          <p className="mt-2 text-navy-muted">Your garage and showroom details on Motodo.</p>

          {editing ? (
            <div className="mt-8">
              <SellerRegistrationForm
                initial={{
                  fullName: profile.fullName,
                  email: profile.email,
                  phone: profile.phone,
                  businessName: profile.businessName,
                  businessType: profile.businessType,
                  nib: profile.nib,
                  yearEstablished: String(profile.yearEstablished),
                  city: profile.city,
                  showroomAddress: profile.showroomAddress,
                  postalCode: profile.postalCode,
                  instagram: profile.instagram ?? "",
                  website: profile.website ?? "",
                  description: profile.description,
                }}
                submitLabel="Save Seller Profile"
                loadingLabel="Saving..."
                onSubmit={handleSubmit}
              />
              <Button
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setEditing(false)
                  setSuccess("")
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
                <dl className="space-y-4">
                  <Row label="Business Name" value={profile.businessName} />
                  <Row label="Business Type" value={profile.businessType} />
                  <Row label="NIB" value={profile.nib} />
                  <Row label="City" value={profile.city} />
                  <Row label="Showroom Address" value={profile.showroomAddress} />
                  <Row label="Phone" value={profile.phone} />
                  <Row label="Instagram" value={profile.instagram ?? ""} />
                  <Row label="Website" value={profile.website ?? ""} />
                  <Row label="Business Description" value={profile.description} />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm text-navy-muted">Verification Status</dt>
                    <dd>
                      <SellerStatusBadge status={profile.status} />
                    </dd>
                  </div>
                </dl>
                {success ? (
                  <p className="mt-4 text-sm text-brand" role="status">
                    {success}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => {
                      setEditing(true)
                      setSuccess("")
                    }}
                  >
                    Edit Seller Profile
                  </Button>
                  <Button variant="secondary" onClick={() => navigate("/seller/dashboard")}>
                    Seller Dashboard
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      </Container>
    </main>
  )
}
