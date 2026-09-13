import { Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { Container } from "./Container"
import { useT, type MessageKey } from "../../i18n"

const motodoLinks: { key: MessageKey; href: string; help?: boolean }[] = [
  { key: "footer.about", href: "/#about" },
  { key: "footer.community", href: "/#community" },
  { key: "footer.articles", href: "/#articles" },
  { key: "footer.privacy", href: "/#privacy" },
  { key: "footer.terms", href: "/#terms" },
  { key: "footer.helpCenter", href: "/#help", help: true },
]

const sellerLinks: { key: MessageKey; href: string }[] = [
  { key: "nav.startSelling", href: "/sell" },
  { key: "nav.sellerCentre", href: "/seller/register" },
  { key: "footer.sellerGuide", href: "/#help" },
  { key: "footer.fees", href: "/#premium" },
  { key: "footer.sellerPolicy", href: "/#terms" },
  { key: "footer.contactTeam", href: "mailto:care@motodo.id" },
]

const linkClass =
  "break-words text-base font-normal leading-6 text-navy-muted transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"

function FooterHeading({ children }: { children: string }) {
  return <p className="text-section font-semibold text-navy">{children}</p>
}

function FooterLink({ href, children, id }: { href: string; children: string; id?: string }) {
  const className = linkClass
  if (href.startsWith("mailto:")) {
    return (
      <a id={id} href={href} className={className}>
        {children}
      </a>
    )
  }
  if (href.startsWith("/#") || href.startsWith("#")) {
    return (
      <a id={id} href={href} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link id={id} to={href} className={className}>
      {children}
    </Link>
  )
}

function AppStoreBadge() {
  const t = useT()
  return (
    <a
      href="#app-store"
      aria-label={t("footer.appStore")}
      className="inline-flex h-10 items-center gap-2 rounded-[7px] bg-black px-3 text-white"
    >
      <svg viewBox="0 0 16 20" className="h-[18px] w-[14px] shrink-0" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.24 10.62c-.02-1.96 1.6-2.9 1.67-2.95-0.91-1.33-2.33-1.51-2.83-1.53-1.2-.12-2.35.71-2.96.71-.61 0-1.55-.69-2.55-.67-1.31.02-2.52.76-3.19 1.94-1.36 2.36-.35 5.85 0.98 7.77.65.94 1.43 2 2.45 1.96 0.98-.04 1.35-.64 2.54-.64 1.18 0 1.52.64 2.56.62 1.06-.02 1.73-.96 2.38-1.91.75-1.09 1.06-2.15 1.08-2.2-.02-.01-2.07-.79-2.09-3.14ZM10.9 4.24c.54-.66.9-1.57.8-2.48-.77.03-1.71.52-2.26 1.17-.5.58-.93 1.51-.82 2.4.87.07 1.75-.44 2.28-1.09Z"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[8px] font-medium tracking-wide">{t("footer.appStoreSmall")}</span>
        <span className="mt-[2px] text-ui font-semibold tracking-tight">App Store</span>
      </span>
    </a>
  )
}

function GooglePlayBadge() {
  const t = useT()
  return (
    <a
      href="#google-play"
      aria-label={t("footer.googlePlay")}
      className="inline-flex h-10 items-center gap-2 rounded-[7px] bg-black px-3 text-white"
    >
      <svg viewBox="0 0 18 20" className="h-[18px] w-[16px] shrink-0" aria-hidden="true">
        <path fill="#34A853" d="M.8 1.1v17.8l10-8.9L.8 1.1Z" />
        <path fill="#FBBC04" d="m10.8 10 .1-.1 5.4 3.1c.7.4.7 1.4 0 1.8l-7.4 4.2L10.8 10Z" />
        <path fill="#EA4335" d="M.8 18.9 8.9 14l1.9-4 5.5 3.1L.8 18.9Z" />
        <path fill="#4285F4" d="M16.3 5.9 10.8 10 .8 1.1 16.3 9.9c.7.4.7 1.4 0 1.8Z" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[8px] font-medium tracking-[0.12em]">{t("footer.googlePlaySmall")}</span>
        <span className="mt-[2px] text-ui font-semibold tracking-tight">Google Play</span>
      </span>
    </a>
  )
}

export function Footer() {
  const t = useT()

  return (
    <footer id="contact" className="min-w-0 border-t border-line bg-white">
      <Container>
        <div className="py-8 lg:grid lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))] lg:gap-0 lg:py-14">
          <div className="min-w-0 lg:pr-8">
            <p className="text-base font-normal leading-none text-navy">motodo.id</p>
            <p className="mt-3 max-w-[260px] text-base font-normal leading-6 text-navy-muted">
              {t("footer.tagline")}
            </p>
            <div id="app-store" className="mt-5 flex flex-wrap gap-2">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
            <p className="mt-6 text-base font-normal text-navy-muted">{t("footer.copyright")}</p>
          </div>

          <div className="mt-8 grid min-w-0 grid-cols-2 lg:mt-0 lg:contents">
            <nav
              className="min-w-0 border-r border-line pr-4 lg:border-l lg:border-r-0 lg:px-8"
              aria-label={t("footer.motodo")}
            >
              <FooterHeading>{t("footer.motodo")}</FooterHeading>
              <ul className="mt-3 flex flex-col gap-2">
                {motodoLinks.map((link) => (
                  <li key={link.key} id={link.help ? "help" : undefined}>
                    <FooterLink href={link.href}>{t(link.key)}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="min-w-0 pl-4 lg:border-l lg:border-line lg:px-8" aria-label={t("footer.forSellers")}>
              <FooterHeading>{t("footer.forSellers")}</FooterHeading>
              <ul className="mt-3 flex flex-col gap-2">
                {sellerLinks.map((link) => (
                  <li key={link.key}>
                    <FooterLink href={link.href}>{t(link.key)}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-8 min-w-0 border-t border-line pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:border-line lg:pl-8 lg:pt-0">
            <FooterHeading>{t("footer.contactUs")}</FooterHeading>
            <p className="mt-3 max-w-[240px] text-base font-normal leading-6 text-navy-muted">
              {t("footer.contactBody")}
            </p>
            <a
              href="mailto:care@motodo.id"
              className="mt-3 inline-flex min-w-0 items-center gap-2 break-all text-base font-normal text-navy hover:text-navy/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              <Mail className="size-3.5 shrink-0 stroke-[1.5] text-navy-muted" aria-hidden="true" />
              care@motodo.id
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
