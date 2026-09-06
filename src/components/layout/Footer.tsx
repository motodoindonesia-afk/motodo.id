import { Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { Container } from "./Container"

const motodoLinks = [
  { label: "Tentang Kami", href: "/#about" },
  { label: "Komunitas", href: "/#community" },
  { label: "Artikel & Edukasi", href: "/#articles" },
  { label: "Kebijakan Privasi", href: "/#privacy" },
  { label: "Syarat & Ketentuan", href: "/#terms" },
  { label: "Pusat Bantuan", href: "/#help" },
] as const

const sellerLinks = [
  { label: "Mulai Berjualan", href: "/sell" },
  { label: "Seller Centre", href: "/seller/register" },
  { label: "Panduan Penjual", href: "/#help" },
  { label: "Biaya & Komisi", href: "/#premium" },
  { label: "Kebijakan Penjual", href: "/#terms" },
  { label: "Hubungi Tim Kami", href: "mailto:care@motodo.id" },
] as const

const linkClass =
  "text-[13px] font-normal leading-6 text-navy-muted transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"

function FooterHeading({ children }: { children: string }) {
  return <p className="text-[13px] font-normal text-navy">{children}</p>
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
  return (
    <a
      href="#app-store"
      aria-label="Download on the App Store"
      className="inline-flex h-10 items-center gap-2 rounded-[7px] bg-black px-3 text-white"
    >
      <svg viewBox="0 0 16 20" className="h-[18px] w-[14px] shrink-0" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.24 10.62c-.02-1.96 1.6-2.9 1.67-2.95-0.91-1.33-2.33-1.51-2.83-1.53-1.2-.12-2.35.71-2.96.71-.61 0-1.55-.69-2.55-.67-1.31.02-2.52.76-3.19 1.94-1.36 2.36-.35 5.85 0.98 7.77.65.94 1.43 2 2.45 1.96 0.98-.04 1.35-.64 2.54-.64 1.18 0 1.52.64 2.56.62 1.06-.02 1.73-.96 2.38-1.91.75-1.09 1.06-2.15 1.08-2.2-.02-.01-2.07-.79-2.09-3.14ZM10.9 4.24c.54-.66.9-1.57.8-2.48-.77.03-1.71.52-2.26 1.17-.5.58-.93 1.51-.82 2.4.87.07 1.75-.44 2.28-1.09Z"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[8px] font-medium tracking-wide">Download on the</span>
        <span className="mt-[2px] text-[13px] font-semibold tracking-tight">App Store</span>
      </span>
    </a>
  )
}

function GooglePlayBadge() {
  return (
    <a
      href="#google-play"
      aria-label="Get it on Google Play"
      className="inline-flex h-10 items-center gap-2 rounded-[7px] bg-black px-3 text-white"
    >
      <svg viewBox="0 0 18 20" className="h-[18px] w-[16px] shrink-0" aria-hidden="true">
        <path fill="#34A853" d="M.8 1.1v17.8l10-8.9L.8 1.1Z" />
        <path fill="#FBBC04" d="m10.8 10 .1-.1 5.4 3.1c.7.4.7 1.4 0 1.8l-7.4 4.2L10.8 10Z" />
        <path fill="#EA4335" d="M.8 18.9 8.9 14l1.9-4 5.5 3.1L.8 18.9Z" />
        <path fill="#4285F4" d="M16.3 5.9 10.8 10 .8 1.1 16.3 9.9c.7.4.7 1.4 0 1.8Z" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[8px] font-medium tracking-[0.12em]">GET IT ON</span>
        <span className="mt-[2px] text-[13px] font-semibold tracking-tight">Google Play</span>
      </span>
    </a>
  )
}

export function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-white">
      <Container>
        <div className="grid gap-8 py-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:py-12 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))] lg:gap-0 lg:py-14">
          <div className="lg:pr-8">
            <p className="text-[13px] font-normal leading-none text-navy">motodo.id</p>
            <p className="mt-3 max-w-[260px] text-[13px] font-normal leading-6 text-navy-muted">
              Custom & Premium Motorcycles Marketplace in Indonesia.
            </p>
            <div id="app-store" className="mt-5 flex flex-wrap gap-2">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
            <p className="mt-6 text-[13px] font-normal text-navy-muted">© 2026 Motodo. All rights reserved.</p>
          </div>

          <nav className="lg:border-l lg:border-line lg:px-8" aria-label="Motodo">
            <FooterHeading>Motodo</FooterHeading>
            <ul className="mt-4 flex flex-col gap-2.5">
              {motodoLinks.map((link) => (
                <li key={link.label} id={link.label === "Pusat Bantuan" ? "help" : undefined}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:border-l lg:border-line lg:px-8" aria-label="Untuk Penjual">
            <FooterHeading>Untuk Penjual</FooterHeading>
            <ul className="mt-4 flex flex-col gap-2.5">
              {sellerLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:border-l lg:border-line lg:pl-8">
            <FooterHeading>Hubungi Kami</FooterHeading>
            <p className="mt-4 max-w-[240px] text-[13px] font-normal leading-6 text-navy-muted">
              Punya pertanyaan? Hubungi tim kami melalui email berikut:
            </p>
            <a
              href="mailto:care@motodo.id"
              className="mt-3 inline-flex items-center gap-2 text-[13px] font-normal text-navy hover:text-navy/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              <Mail className="size-3 shrink-0 stroke-[1.5] text-navy-muted" aria-hidden="true" />
              care@motodo.id
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
