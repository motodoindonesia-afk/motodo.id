import { Mail } from "lucide-react"
import { Container } from "./Container"

const companyLinks = [
  { label: "About Us", href: "#about" },
  { label: "Community", href: "#community" },
  { label: "Articles & Education", href: "#articles" },
  { label: "Privacy Policy", href: "#privacy" },
] as const

const serviceLinks = [
  { label: "Sell on Motodo", href: "#sell" },
  { label: "Motodo Premium", href: "#premium" },
  { label: "Terms of Service", href: "#terms" },
  { label: "Help Center", href: "#help" },
] as const

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="text-[15px] leading-6 text-navy hover:text-navy/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      {children}
    </a>
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
        <div className="grid gap-12 py-14 sm:py-16 lg:grid-cols-12 lg:gap-10 lg:py-[72px]">
          <div className="lg:col-span-4">
            <p className="text-[22px] font-bold leading-none tracking-tight text-navy">
              motodo.id
            </p>
            <p className="mt-4 max-w-[240px] text-[15px] leading-6 text-navy">
              Custom & Premium Motorcycles
              <br />
              Marketplace in Indonesia.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>

          <nav className="lg:col-span-5" aria-label="Footer">
            <p className="text-[15px] font-bold text-navy">motodo.id</p>
            <div className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
              <ul className="flex flex-col gap-3.5">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-3.5">
                {serviceLinks.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="lg:col-span-3">
            <p className="text-[15px] font-bold text-navy">Contact Us</p>
            <p className="mt-5 text-[15px] leading-6 text-navy">Get in touch with our team:</p>
            <a
              href="mailto:care@motodo.id"
              className="mt-4 inline-flex items-center gap-2.5 text-[15px] font-semibold text-navy hover:text-navy/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              <Mail className="size-4 shrink-0 stroke-[1.5]" aria-hidden="true" />
              care@motodo.id
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line py-5 text-[13px] text-navy-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 motodo.id. All rights reserved.</p>
          <p>Indonesia</p>
        </div>
      </Container>
    </footer>
  )
}
