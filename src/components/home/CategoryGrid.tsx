import { categories } from "../../data/categories"
import { Container } from "../layout/Container"
import { CategoryCard } from "../ui/CategoryCard"
import { ViewAllLink } from "../ui/ViewAllLink"

export function CategoryGrid() {
  return (
    <section id="categories" className="pb-14 sm:pb-16">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Browse by Category</h2>
          <ViewAllLink href="/browse">View all</ViewAllLink>
        </div>
        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </Container>
    </section>
  )
}
