import type { ReactNode } from "react"
import { Bike, ShieldCheck, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { MotodoLogo } from "../brand/MotodoLogo"
import { heroImage } from "../../data/site"
import { LanguageSwitcher, useT } from "../../i18n"

type Variant = "login" | "signup"

type Props = {
  variant: Variant
  children: ReactNode
}

function AuthHelp() {
  const t = useT()
  return (
    <div className="mt-8 text-center text-sm text-navy-muted">
      <p className="font-medium text-navy">{t("auth.needHelp")}</p>
      <p className="mt-1 leading-relaxed">
        {t("auth.helpVisitBefore")}
        <Link to="/#help" className="font-medium text-brand hover:text-brand-hover">
          {t("footer.helpCenter")}
        </Link>
        {t("auth.helpVisitBetween")}
        <a href="mailto:care@motodo.id" className="font-medium text-brand hover:text-brand-hover">
          {t("footer.contactUs")}
        </a>
      </p>
    </div>
  )
}

export function AuthLayout({ variant, children }: Props) {
  const t = useT()
  const isLogin = variant === "login"

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-[#f4f7fb] lg:grid lg:grid-cols-2">
      <aside className="relative isolate min-h-[13.75rem] shrink-0 overflow-hidden sm:min-h-[16.5rem] md:min-h-[18rem] lg:sticky lg:top-0 lg:h-dvh lg:min-h-dvh">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_30%] lg:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/55 via-brand/35 to-navy/70" />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[22%] bg-brand/80 lg:block"
          style={{ clipPath: "polygon(55% 0, 100% 0, 100% 100%, 0 100%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full min-h-[13.75rem] flex-col justify-between px-5 py-5 sm:px-8 sm:py-7 lg:min-h-dvh lg:px-12 lg:py-10">
          <Link to="/" aria-label="Motodo home" className="w-fit text-white">
            <MotodoLogo className="h-12 w-[100px] sm:h-14 sm:w-[116px]" />
            <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.22em] text-white/80 uppercase">
              {t("auth.brandTagline")}
            </span>
          </Link>

          <div className="max-w-lg py-3 lg:py-0">
            <h1 className="text-display font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("auth.heroTitleLead")}{" "}
              <span className="text-[#c9dcff]">{t("auth.heroTitleAccent")}</span>
            </h1>
            <p className="mt-2 hidden max-w-md text-sm leading-relaxed text-white/85 sm:block lg:mt-4 lg:text-base">
              {t("auth.heroBody")}
            </p>
          </div>

          <ul className="hidden gap-6 text-xs font-medium text-white/90 sm:flex lg:text-sm">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              {t("auth.trustVerified")}
            </li>
            <li className="flex items-center gap-2">
              <Bike className="size-4 shrink-0" aria-hidden="true" />
              {t("auth.trustSelection")}
            </li>
            <li className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden="true" />
              {t("auth.trustCommunity")}
            </li>
          </ul>
        </div>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-8 sm:py-8 lg:overflow-y-auto lg:px-10 lg:py-10">
        <div className="mb-4 flex justify-end lg:mb-6">
          <LanguageSwitcher compact tone="onLight" />
        </div>

        <div className="mx-auto flex w-full max-w-[36.5rem] flex-1 items-center">
          <div className="w-full rounded-2xl border border-white bg-white px-5 py-7 shadow-[0_16px_48px_rgba(15,40,80,0.08)] sm:px-9 sm:py-9">
            <h2 className="text-heading font-bold tracking-tight text-navy sm:text-2xl">
              {isLogin ? t("auth.cardTitleLogin") : t("auth.cardTitleSignup")}
            </h2>
            <p className="mt-2 text-sm text-navy-muted">
              {isLogin ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <Link to="/signup" className="font-semibold text-brand hover:text-brand-hover">
                    {t("auth.signupNow")}
                  </Link>
                </>
              ) : (
                <>
                  {t("auth.hasAccount")}{" "}
                  <Link to="/login" className="font-semibold text-brand hover:text-brand-hover">
                    {t("auth.signInCta")}
                  </Link>
                </>
              )}
            </p>
            <div className="mt-7">{children}</div>
            <AuthHelp />
          </div>
        </div>
      </section>
    </div>
  )
}
