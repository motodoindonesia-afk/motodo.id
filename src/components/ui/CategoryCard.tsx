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
      className="flex min-w-[140px] flex-col items-center rounded-xl bg-surface px-4 py-6 text-center transition-transform hover:-translate-y-0.5 hover:ring-1 hover:ring-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:min-w-0"
    >
      <MotorcycleSilhouette variant={category.variant} />
      <span className="mt-4 text-sm font-semibold text-navy">{category.name}</span>
    </Link>
  )
}
