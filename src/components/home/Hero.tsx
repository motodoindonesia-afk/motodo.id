import type { ReactNode } from "react"
import { ArrowRight, BadgeCheck, Bike, ShieldCheck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { heroImage, promoGearImage, promoSellImage } from "../../data/site"
import { Container } from "../layout/Container"
import { useT } from "../../i18n"

export function Hero() {
  const navigate = useNavigate()
  const t = useT()

  return (
    <section className="py-4 sm:py-5">
      <Container className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(240px,1fr)]">
        <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-line shadow-card sm:min-h-[280px] lg:min-h-[320px]">
          <img src={heroImage} alt={t("home.heroAlt")} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/45 to-navy/20" />
          <div className="relative flex h-full min-h-[240px] flex-col justify-between p-5 sm:min-h-[280px] sm:p-6 lg:min-h-[320px] lg:p-7">
            <div className="max-w-md">
              <h1 className="text-page font-bold tracking-tight text-white sm:text-[1.625rem]">
                {t("home.heroTitle")}
              </h1>
              <p className="mt-2 max-w-sm text-ui leading-relaxed text-white/90">
                {t("home.heroBody")}
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-ui font-semibold text-brand hover:bg-white/90"
                onClick={() => navigate("/browse")}
              >
                {t("home.heroCta")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 rounded-lg bg-navy/55 px-3 py-2.5 backdrop-blur-[2px] sm:grid-cols-3">
              <TrustItem
                icon={<ShieldCheck className="size-4 shrink-0" />}
                title={t("home.trustVerified")}
                text={t("home.trustVerifiedBody")}
              />
              <TrustItem
                icon={<Bike className="size-4 shrink-0" />}
                title={t("home.trustChoice")}
                text={t("home.trustChoiceBody")}
              />
              <TrustItem
                icon={<BadgeCheck className="size-4 shrink-0" />}
                title={t("home.trustSafe")}
                text={t("home.trustSafeBody")}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Link
            to="/browse"
            className="relative flex min-h-[132px] overflow-hidden rounded-2xl border border-line bg-brand-soft p-4 shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <div className="relative z-10 max-w-[58%]">
              <p className="text-ui text-navy">{t("home.promoGear")}</p>
              <p className="mt-1 text-[1.05rem] font-bold leading-tight text-navy">{t("home.promoGearOffer")}</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-meta font-semibold text-white">
                {t("home.promoGearCta")}
                <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </div>
            <img
              src={promoGearImage}
              alt=""
              className="absolute right-0 top-1/2 h-[120%] w-[48%] -translate-y-1/2 object-cover"
            />
          </Link>

          <Link
            id="sell"
            to="/sell"
            className="relative flex min-h-[132px] overflow-hidden rounded-2xl border border-navy/20 bg-navy p-4 shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <div className="relative z-10 max-w-[62%]">
              <p className="text-[1.05rem] font-bold leading-tight text-white">{t("home.promoSell")}</p>
              <p className="mt-1 text-meta leading-snug text-white/85">
                {t("home.promoSellBody")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-meta font-semibold text-brand">
                {t("nav.startSelling")}
                <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </div>
            <img
              src={promoSellImage}
              alt=""
              className="absolute right-0 top-1/2 h-[120%] w-[46%] -translate-y-1/2 object-cover opacity-90"
            />
          </Link>
        </div>
      </Container>
    </section>
  )
}

function TrustItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-white">
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block text-meta font-semibold">{title}</span>
        <span className="block text-[11px] text-white/80">{text}</span>
      </span>
    </div>
  )
}
