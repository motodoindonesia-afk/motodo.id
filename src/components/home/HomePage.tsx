import { Hero } from "./Hero"
import { CategoryGrid } from "./CategoryGrid"
import { FlashSale } from "./FlashSale"
import { BestSellers } from "./BestSellers"
import { FeaturedListings } from "./FeaturedListings"

export function HomePage() {
  return (
    <>
      <a
        href="#browse"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-navy"
      >
        Skip to listings
      </a>
      <main id="top">
        <Hero />
        <CategoryGrid />
        <FlashSale />
        <BestSellers />
        <FeaturedListings />
        <section id="about" className="sr-only">
          MOTODO.ID is a marketplace for custom and premium motorcycles in Indonesia.
        </section>
      </main>
    </>
  )
}

