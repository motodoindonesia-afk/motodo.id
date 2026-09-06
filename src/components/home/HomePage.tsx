import { Hero } from "./Hero"
import { CategoryGrid } from "./CategoryGrid"
import { FlashSale } from "./FlashSale"
import { BestSellers } from "./BestSellers"
import { FeaturedListings } from "./FeaturedListings"
import { useT } from "../../i18n"

export function HomePage() {
  const t = useT()
  return (
    <>
      <a
        href="#browse"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-navy"
      >
        {t("common.skipListings")}
      </a>
      <main id="top">
        <Hero />
        <CategoryGrid />
        <FlashSale />
        <BestSellers />
        <FeaturedListings />
        <section id="about" className="sr-only">
          {t("home.aboutSr")}
        </section>
      </main>
    </>
  )
}
