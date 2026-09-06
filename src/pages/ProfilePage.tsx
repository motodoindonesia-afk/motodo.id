import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { roleLabel } from "../lib/auth"
import { formatMemberSince, roleDescription } from "../lib/profile"
import { deleteListing, getListingsBySeller } from "../lib/listings"
import { getSellerProfile, isSellerProfilesReady, sellerStatusHeading } from "../lib/seller"
import { isAdmin } from "../lib/admin"
import { useSellerLive } from "../lib/useSellerLive"
import { useListingsLive } from "../lib/useListingsLive"
import { SellerStatusBadge } from "../components/seller/SellerStatusBadge"
import { SellerListingCard } from "../components/seller/SellerListingCard"
import { DeleteListingModal } from "../components/seller/DeleteListingModal"
import { AuthInput, Field } from "../components/auth/AuthField"
import { Button } from "../components/ui/Button"
import { ViewAllLink } from "../components/ui/ViewAllLink"
import { Container } from "../components/layout/Container"
import type { MotorcycleListing } from "../types/sellerListing"

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-navy-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value}</dd>
    </div>
  )
}

function SellerCenter({ userId, isSellerRole }: { userId: string; isSellerRole: boolean }) {
  const navigate = useNavigate()
  useSellerLive()
  const profile = getSellerProfile(userId)

  if (!profile && !isSellerRole) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-bold text-navy">Want to sell your motorcycle?</h2>
        <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
          <p className="text-sm leading-relaxed text-navy-muted">
            Register as a Motodo seller with your garage or dealership details.
          </p>
          <Button className="mt-4" onClick={() => navigate("/seller/register")}>
            Become a Seller
          </Button>
        </div>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-bold text-navy">Seller Center</h2>
        <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
          <p className="text-sm font-medium text-navy">Complete Seller Registration</p>
          <p className="mt-2 text-sm leading-relaxed text-navy-muted">
            Add your business, NIB, and showroom details to start listing motorcycles.
          </p>
          <Button className="mt-4" onClick={() => navigate("/seller/register")}>
            Become a Seller
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-navy">Seller Center</h2>
      <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-navy">{sellerStatusHeading(profile.status)}</p>
          <SellerStatusBadge
            status={profile.status}
            label={profile.status === "approved" ? "Verified Seller" : undefined}
          />
        </div>
        <p className="mt-2 text-sm text-navy-muted">{profile.businessName}</p>
        {profile.status === "rejected" && profile.rejectionReason ? (
          <p className="mt-2 text-sm text-red-700">{profile.rejectionReason}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/seller/dashboard")}>Seller Dashboard</Button>
          {profile.status === "rejected" ? (
            <Button variant="secondary" onClick={() => navigate("/seller/register")}>
              Edit Registration
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function ProfilePage() {
  const { user, profile, logout, updateProfile, loading } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<MotorcycleListing | null>(null)
  useListingsLive()
  useSellerLive()

  if (loading || !isSellerProfilesReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }

  if (!user) return null
  const displayName = profile?.fullName ?? user.fullName
  const accountType = profile?.accountType ?? user.role
  const privilegeLabel = profile?.role === "admin" ? "Admin" : "User"
  const sellerListings = getListingsBySeller(user.id)
  const sellerProfile = getSellerProfile(user.id)

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  async function saveProfile() {
    if (!fullName.trim()) {
      setError("Full name is required.")
      setSuccess("")
      return
    }
    try {
      const next = await updateProfile({ fullName: fullName.trim() })
      if (!next) {
        setError("Unable to update your profile.")
        setSuccess("")
        return
      }
      setEditing(false)
      setError("")
      setSuccess("Profile updated.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update your profile.")
      setSuccess("")
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">My Profile</h1>
          <p className="mt-2 text-navy-muted">Your Motodo account details.</p>

          <section className="mt-8 rounded-2xl border border-line bg-white px-5 py-6 sm:px-6">
            <dl className="space-y-4">
              <InfoRow label="Full Name" value={displayName} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Account Type" value={roleLabel(accountType)} />
              <InfoRow label="Role" value={privilegeLabel} />
              <InfoRow label="Member Since" value={formatMemberSince(profile?.createdAt ?? user.createdAt)} />
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">Personal Information</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              {editing ? (
                <div className="space-y-4">
                  <Field label="Full Name" htmlFor="profile-name" error={error}>
                    <AuthInput
                      id="profile-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      invalid={Boolean(error)}
                    />
                  </Field>
                  <div>
                    <p className="text-sm font-medium text-navy">Email</p>
                    <p className="mt-1 text-sm text-navy-muted">{user.email}</p>
                    <p className="mt-1 text-xs text-navy-muted">Email cannot be changed yet.</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">Account Type</p>
                    <p className="mt-1 text-sm text-navy-muted">{roleLabel(accountType)}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={saveProfile}>Save</Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                    setFullName(displayName)
                        setEditing(false)
                        setError("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <dl className="space-y-4">
                    <InfoRow label="Full Name" value={displayName} />
                    <InfoRow label="Email" value={user.email} />
                    <InfoRow label="Account Type" value={roleLabel(accountType)} />
                    <InfoRow label="Role" value={privilegeLabel} />
                  </dl>
                  {success ? (
                    <p className="mt-4 text-sm text-brand" role="status">
                      {success}
                    </p>
                  ) : null}
                  <Button
                    className="mt-6"
                    onClick={() => {
                      setFullName(displayName)
                      setEditing(true)
                      setSuccess("")
                    }}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">Account Type</h2>
            <div className="mt-4 rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
              <p className="text-sm font-semibold text-navy">{roleLabel(accountType)}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-muted">{roleDescription(accountType)}</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">Orders</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <p className="text-sm text-navy-muted">View motorcycles you have ordered.</p>
              <p className="mt-2 text-sm text-navy-muted">You can review a motorcycle after your order is completed.</p>
              <Button className="mt-4" onClick={() => navigate("/orders")}>
                My Orders
              </Button>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">Messages</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <p className="text-sm text-navy-muted">Ask sellers about motorcycles and keep your conversations in one place.</p>
              <Button className="mt-4" onClick={() => navigate("/messages")}>
                Messages
              </Button>
            </div>
          </section>

          <SellerCenter userId={user.id} isSellerRole={accountType === "seller"} />

          {isAdmin(user) ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-navy">Admin</h2>
              <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
                <p className="text-sm text-navy-muted">Review seller registrations and marketplace operations.</p>
                <Button className="mt-4" onClick={() => navigate("/admin")}>
                  Admin Dashboard
                </Button>
              </div>
            </section>
          ) : null}

          {sellerProfile ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-navy">My Listings</h2>
              {sellerListings.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-line px-5 py-8 text-center sm:px-6">
                  <p className="text-sm text-navy-muted">You haven't listed any motorcycles yet.</p>
                  {sellerProfile.status === "approved" ? (
                    <Button className="mt-4" onClick={() => navigate("/seller/listings/new")}>
                      Add Motorcycle
                    </Button>
                  ) : (
                    <p className="mt-2 text-sm text-navy-muted">
                      Listing creation is available after seller verification is approved.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {sellerListings.map((listing) => (
                    <SellerListingCard key={listing.id} listing={listing} onDelete={setDeleteTarget} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-bold text-navy">Saved Motorcycles</h2>
              <ViewAllLink href="/favorites">View All Saved Motorcycles</ViewAllLink>
            </div>
            <div className="mt-4 rounded-2xl border border-line px-5 py-8 sm:px-6">
              <p className="text-sm text-navy-muted">
                Saved motorcycles will appear here once Favorites is available.
              </p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">Account</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <p className="text-sm text-navy-muted">Sign out of your Motodo account on this device.</p>
              <Button variant="secondary" className="mt-4" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </section>
        </div>
      </Container>
      {deleteTarget ? (
        <DeleteListingModal
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteListing(deleteTarget.id, user.id)
            setDeleteTarget(null)
          }}
        />
      ) : null}
    </main>
  )
}
