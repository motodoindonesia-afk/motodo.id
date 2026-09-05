import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { navLinks } from "../../data/site"
import { Button } from "../ui/Button"
import { SearchBar } from "../ui/SearchBar"
import { TextLink } from "../ui/TextLink"
import { Container } from "./Container"

export function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function goToBrowse(query: string) {
    const trimmed = query.trim()
    navigate(trimmed ? `/browse?q=${encodeURIComponent(trimmed)}` : "/browse")
    setOpen(false)
  }

  return (
    <header className="border-b border-line/80 bg-white">
      <Container className="flex h-16 items-center gap-4 lg:h-[72px] lg:gap-6">
        <Link to="/" className="shrink-0 text-lg font-bold tracking-tight text-navy">
          Motodo
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <TextLink key={link.href} href={link.href}>
              {link.label}
            </TextLink>
          ))}
        </nav>

        <SearchBar
          id="header-search"
          className="hidden min-w-0 flex-1 sm:block lg:max-w-lg"
          onSubmitSearch={goToBrowse}
        />

        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <TextLink href="/#login">Login</TextLink>
          <Button>Sign Up</Button>
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-navy lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open ? (
        <div id="mobile-menu" className="border-t border-line px-5 py-4 lg:hidden">
          <SearchBar id="header-search-mobile" className="sm:hidden" onSubmitSearch={goToBrowse} />
          <nav className="mt-4 grid gap-3" aria-label="Mobile">
            {navLinks.map((link) => (
              <TextLink
                key={link.href}
                href={link.href}
                className="py-1"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </TextLink>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3">
            <TextLink href="/#login">Login</TextLink>
            <Button className="flex-1">Sign Up</Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
