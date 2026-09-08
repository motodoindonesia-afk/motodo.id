import {
  Bell,
  ChevronRight,
  Globe,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  UserRound,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { AccountLayout } from "../components/profile/AccountLayout"
import { LanguageSwitcher, useT, type MessageKey } from "../i18n"
import { cn } from "../lib/cn"

type SettingRow = {
  id: string
  label: MessageKey
  hint?: MessageKey
  to?: string
  available: boolean
  icon: LucideIcon
  extra?: "language"
}

const ACCOUNT_ROWS: SettingRow[] = [
  { id: "profile", label: "account.navProfile", to: "/profile/edit", available: true, icon: UserRound },
  { id: "contact", label: "account.settingContact", hint: "account.settingContactHint", available: false, icon: Mail },
  { id: "security", label: "account.settingSecurity", available: false, icon: Lock },
]

const NOTIFY_ROWS: SettingRow[] = [
  { id: "notify", label: "account.settingNotify", to: "/notifications", available: true, icon: Bell },
  { id: "chatNotify", label: "account.settingChatNotify", available: false, icon: MessageCircle },
]

const PREF_ROWS: SettingRow[] = [
  { id: "language", label: "account.settingLanguage", available: true, icon: Globe, extra: "language" },
  { id: "currency", label: "account.settingCurrency", available: false, icon: Wallet },
]

const PRIVACY_ROWS: SettingRow[] = [
  { id: "privacy", label: "account.navPrivacy", available: false, icon: Shield },
]

export function SettingsPage() {
  const t = useT()

  return (
    <AccountLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-navy sm:text-[22px]">{t("account.settingsTitle")}</h1>
          <p className="mt-1 text-[14px] text-navy-muted">{t("account.settingsSubtitle")}</p>
        </div>
        <SettingsGroup title={t("account.sectionAccount")} rows={ACCOUNT_ROWS} />
        <SettingsGroup title={t("account.sectionNotify")} rows={NOTIFY_ROWS} />
        <SettingsGroup title={t("account.sectionPrefs")} rows={PREF_ROWS} />
        <SettingsGroup title={t("account.sectionPrivacy")} rows={PRIVACY_ROWS} />
      </div>
    </AccountLayout>
  )
}

function SettingsGroup({ title, rows }: { title: string; rows: SettingRow[] }) {
  const t = useT()
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <h2 className="border-b border-line px-4 py-2.5 text-[12px] font-semibold tracking-wide text-navy-muted uppercase">
        {title}
      </h2>
      <ul>
        {rows.map((row) => {
          const Icon = row.icon
          const body = (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-navy">{t(row.label)}</span>
                {row.hint ? <span className="mt-0.5 block text-[12px] text-navy-muted">{t(row.hint)}</span> : null}
              </span>
              {row.extra === "language" ? (
                <LanguageSwitcher tone="onLight" />
              ) : row.available ? (
                <ChevronRight className="size-4 shrink-0 text-navy-muted" aria-hidden="true" />
              ) : (
                <span className="shrink-0 text-[11px] font-medium text-navy-muted">{t("account.soonBadge")}</span>
              )}
            </>
          )

          if (!row.available) {
            return (
              <li key={row.id} className="border-t border-line first:border-t-0">
                <div
                  className="flex cursor-not-allowed items-center gap-3 px-4 py-3 opacity-70"
                  title={t("account.comingSoon")}
                >
                  {body}
                </div>
              </li>
            )
          }

          if (row.extra === "language") {
            return (
              <li key={row.id} className="border-t border-line first:border-t-0">
                <div className="flex min-w-0 flex-wrap items-center gap-3 px-3 py-3 min-[769px]:px-4">{body}</div>
              </li>
            )
          }

          return (
            <li key={row.id} className="border-t border-line first:border-t-0">
              <Link
                to={row.to!}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                )}
              >
                {body}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
