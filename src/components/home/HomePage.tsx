import { Header } from "../layout/Header"
import { Footer } from "../layout/Footer"
import { Hero } from "./Hero"
import { CategoryGrid } from "./CategoryGrid"
import { FeaturedListings } from "./FeaturedListings"
import { SellerCta } from "./SellerCta"

export function HomePage() {
  return (
    <>
      <a
        href="#browse"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-navy"
      >
        Skip to listings
      </a>
      <Header />
      <main id="top">
        <Hero />
        <CategoryGrid />
        <FeaturedListings />
        <SellerCta />
        <section id="about" className="sr-only">
          MOTODO.ID is a marketplace for custom and premium motorcycles in Indonesia.
        </section>
        <section id="login" className="sr-only">
          Login will be available in a later version.
        </section>
      </main>
      <Footer />
    </>
  )
}
