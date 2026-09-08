import { Link, Navigate, useNavigate } from "react-router-dom"
import {
  Bell,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  Palette,
  Store,
  Truck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { SellerCenterLayout } from "../../components/seller/SellerCenterLayout"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { useAuth } from "../../context/AuthContext"
import { useLanguage, type MessageKey } from "../../i18n"
import { cn } from "../../lib/cn"
import { getSellerProfile } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"

type SettingCard = {
  id: string
  icon: LucideIcon
  title: MessageKey
  hint: MessageKey
  to?: string
  available: boolean
  action?: MessageKey
}

const INFO_CARDS: SettingCard[] = [
  {
    id: "profile",
    icon: Store,
    title: "seller.navStoreProfile",
    hint: "seller.settingProfileHint",
    to: "/seller/profile",
    available: true,
    action: "seller.settingsView",
  },
  {
    id: "look",
    icon: Palette,
    title: "seller.navStoreLook",
    hint: "seller.settingLookHint",
    available: false,
  },
]

const OPS_CARDS: SettingCard[] = [
  {
    id: "address",
    icon: MapPin,
    title: "seller.settingAddress",
    hint: "seller.settingAddressHint",
    to: "/seller/profile",
    available: true,
  },
  {
    id: "hours",
    icon: Clock,
    title: "seller.settingHours",
    hint: "seller.settingHoursHint",
    available: false,
  },
]

const SALES_CARDS: SettingCard[] = [
  {
    id: "shipping",
    icon: Truck,
    title: "seller.settingShipping",
    hint: "seller.settingShippingHint",
    available: false,
  },
  {
    id: "payment",
    icon: CreditCard,
    title: "seller.settingPayment",
    hint: "seller.settingPaymentHint",
    available: false,
  },
]

const ACCOUNT_CARDS: SettingCard[] = [
  {
    id: "notify",
    icon: Bell,
    title: "seller.settingNotify",
    hint: "seller.settingNotifyHint",
    to: "/notifications",
    available: true,
  },
  {
    id: "access",
    icon: Users,
    title: "seller.settingAccess",
    hint: "seller.settingAccessHint",
    available: false,
  },
]

export function SellerSettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  const { t } = useLanguage()
  const profile = user ? getSellerProfile(user.id) : null

  if (!user) return null
  if (!profile) return <Navigate to="/profile" replace />

  const statusLabel =
    profile.status === "approved"
      ? t("listing.verifiedSeller")
      : profile.status === "rejected"
        ? t("seller.verifyRejected")
        : t("seller.pendingVerify")

  return (
    <SellerCenterLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-navy">{t("seller.settingsTitle")}</h1>
          <p className="mt-1 text-[14px] leading-relaxed text-navy-muted">{t("seller.settingsSubtitle")}</p>
        </div>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <h2 className="text-[16px] font-semibold text-navy">{t("seller.settingStatus")}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-[14px] font-medium text-navy">{profile.businessName}</p>
            <SellerStatusBadge status={profile.status} label={statusLabel} />
          </div>
          {profile.status === "rejected" ? (
            <>
              {profile.rejectionReason ? (
                <p className="mt-2 text-[13px] leading-relaxed text-navy">{profile.rejectionReason}</p>
              ) : null}
              <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/register")}>
                {t("profile.editRegistration")}
              </Button>
            </>
          ) : null}
        </section>

        <SettingsSection title={t("seller.sectionInfo")} cards={INFO_CARDS} />
        <SettingsSection title={t("seller.sectionOps")} cards={OPS_CARDS} />
        <SettingsSection title={t("seller.sectionSales")} cards={SALES_CARDS} />
        <SettingsSection title={t("seller.sectionAccountNotify")} cards={ACCOUNT_CARDS} />
      </div>
    </SellerCenterLayout>
  )
}

function SettingsSection({ title, cards }: { title: string; cards: SettingCard[] }) {
  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-navy-muted uppercase">{title}</h2>
      <div className="grid grid-cols-1 gap-2 min-[768px]:grid-cols-2">
        {cards.map((card) => (
          <SettingsCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}

function SettingsCard({ card }: { card: SettingCard }) {
  const t = useLanguage().t
  const Icon = card.icon
  const body = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-navy">{t(card.title)}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-navy-muted">{t(card.hint)}</span>
      </span>
      {card.available ? (
        card.action ? (
          <span className="shrink-0 text-[12px] font-medium text-brand">{t(card.action)}</span>
        ) : (
          <ChevronRight className="size-4 shrink-0 text-navy-muted" aria-hidden="true" />
        )
      ) : (
        <span className="shrink-0 text-[11px] font-medium text-navy-muted">{t("account.soonBadge")}</span>
      )}
    </>
  )

  const className = "flex h-full items-start gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card"

  if (!card.available) {
    return (
      <div
        className={cn(className, "cursor-not-allowed opacity-70")}
        aria-disabled="true"
        title={t("account.comingSoon")}
      >
        {body}
      </div>
    )
  }

  return (
    <Link
      to={card.to!}
      className={cn(
        className,
        "hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      )}
    >
      {body}
    </Link>
  )
}
