import { Link } from "react-router-dom"
import type { Category } from "../../types/marketplace"
import { MotorcycleSilhouette } from "./MotorcycleSilhouette"

type Props = {
  category: Category
}

export function CategoryCard({ category }: Props) {
  return (
    <Link
      to={`/browse?category=${encodeURIComponent(category.name)}`}
      className="flex min-w-[120px] flex-col items-center rounded-lg bg-surface px-3 py-4 text-center transition-colors hover:ring-1 hover:ring-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:min-w-0"
    >
      <MotorcycleSilhouette variant={category.variant} />
      <span className="mt-2.5 text-ui font-semibold text-navy">{category.name}</span>
    </Link>
  )
}
