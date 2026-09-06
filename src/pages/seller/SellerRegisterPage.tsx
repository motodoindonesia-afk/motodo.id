import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { createSellerProfile, getSellerProfile, resubmitSellerProfile } from "../../lib/seller"
import type { SellerFormValues } from "../../lib/sellerForm"
import { SellerDataGate } from "../../components/seller/SellerDataGate"
import { SellerRegistrationForm } from "../../components/seller/SellerRegistrationForm"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { useT } from "../../i18n"

export function SellerRegisterPage() {
  const { user } = useAuth()

  if (!user) return null
  return (
    <SellerDataGate>
      <SellerRegisterInner />
    </SellerDataGate>
  )
}

function SellerRegisterInner() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const t = useT()
  const [submitted, setSubmitted] = useState(false)

  if (!user) return null
  const existing = getSellerProfile(user.id)
  if (existing && existing.status !== "rejected" && !submitted) {
    return <Navigate to="/seller/dashboard" replace />
  }

  async function handleSubmit(values: SellerFormValues) {
    if (!user) return
    const payload = {
      userId: user.id,
      fullName: values.fullName.trim(),
      email: user.email,
      phone: values.phone.trim(),
      businessName: values.businessName.trim(),
      businessType: values.businessType === "" ? "Other" : values.businessType,
      nib: values.nib.replace(/\s/g, ""),
      yearEstablished: Number(values.yearEstablished),
      city: values.city.trim(),
      showroomAddress: values.showroomAddress.trim(),
      postalCode: values.postalCode.trim(),
      instagram: values.instagram.trim() || undefined,
      website: values.website.trim() || undefined,
      description: values.description.trim(),
      sellerFleetAvailable: existing?.sellerFleetAvailable ?? false,
    }
    if (existing?.status === "rejected") {
      await resubmitSellerProfile(user.id, payload)
    } else {
      await createSellerProfile(payload)
    }
    updateProfile({ fullName: values.fullName.trim(), role: "seller" }).catch(() => undefined)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-line px-6 py-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.regSubmitted")}</h1>
            <p className="mt-3 text-base leading-relaxed text-navy-muted">
              {t("seller.regPending")}
            </p>
            <Button className="mt-8" onClick={() => navigate("/seller/dashboard")}>
              {t("seller.goDashboard")}
            </Button>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.becomeTitle")}</h1>
          <p className="mt-2 text-base leading-relaxed text-navy-muted">
            {existing?.status === "rejected" ? t("seller.becomeResubmit") : t("seller.becomeCreate")}
          </p>
          <div className="mt-8">
            <SellerRegistrationForm
              initial={
                existing
                  ? {
                      fullName: existing.fullName,
                      email: user.email,
                      phone: existing.phone,
                      businessName: existing.businessName,
                      businessType: existing.businessType,
                      nib: existing.nib,
                      yearEstablished: String(existing.yearEstablished),
                      city: existing.city,
                      showroomAddress: existing.showroomAddress,
                      postalCode: existing.postalCode,
                      instagram: existing.instagram ?? "",
                      website: existing.website ?? "",
                      description: existing.description,
                    }
                  : { fullName: user.fullName, email: user.email }
              }
              submitLabel={existing?.status === "rejected" ? t("seller.resubmit") : t("seller.submitReg")}
              loadingLabel={t("seller.submitting")}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </Container>
    </main>
  )
}
