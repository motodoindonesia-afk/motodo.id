import type { LucideIcon } from "lucide-react"
import {
  Bike,
  CircleDot,
  Cpu,
  Droplets,
  Hammer,
  HardHat,
  LayoutGrid,
  MoreHorizontal,
  Percent,
  Settings,
  Shirt,
  Sparkles,
  Star,
  User,
  Puzzle,
  Wrench,
} from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"
import { Container } from "../layout/Container"
import { ViewAllLink } from "../ui/ViewAllLink"
import { surfaceCard } from "../ui/surface"
import { useT, type MessageKey } from "../../i18n"

const shortcuts: { key: MessageKey; href: string; icon: LucideIcon; active?: boolean }[] = [
  { key: "cat.all", href: "/browse", icon: LayoutGrid, active: true },
  { key: "cat.custom", href: "/browse?category=Chopper", icon: Wrench },
  { key: "cat.classic", href: "/browse?q=klasik", icon: Bike },
  { key: "cat.premium", href: "/browse?q=premium", icon: Star },
  { key: "cat.accessories", href: "/browse?q=Aksesoris", icon: Sparkles },
  { key: "cat.apparel", href: "/browse?q=Apparel", icon: Shirt },
  { key: "cat.sparepart", href: "/browse?q=Sparepart", icon: Settings },
  { key: "cat.helmet", href: "/browse?q=Helm", icon: HardHat },
  { key: "cat.care", href: "/browse?q=Perawatan", icon: Droplets },
  { key: "cat.promo", href: "/browse", icon: Percent },
  { key: "cat.electronics", href: "/browse?q=Elektronik", icon: Cpu },
  { key: "cat.ridingGear", href: "/browse?q=Perlengkapan%20Riding", icon: HardHat },
  { key: "cat.tires", href: "/browse?q=Ban", icon: CircleDot },
  { key: "cat.oil", href: "/browse?q=Oli", icon: Droplets },
  { key: "cat.workshop", href: "/browse?q=Bengkel", icon: Hammer },
  { key: "cat.beauty", href: "/browse?q=Perawatan", icon: Sparkles },
  { key: "cat.mensApparel", href: "/browse?q=Apparel", icon: Shirt },
  { key: "cat.womensApparel", href: "/browse?q=Apparel", icon: User },
  { key: "cat.hobbies", href: "/browse?q=Miniatur", icon: Puzzle },
  { key: "cat.other", href: "/browse", icon: MoreHorizontal },
]

export function CategoryGrid() {
  const t = useT()
  return (
    <section id="categories" className="pb-5">
      <Container>
        <div className={surfaceCard("px-4 py-4 sm:px-5")}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-section font-semibold text-navy">{t("home.categories")}</h2>
          <ViewAllLink href="/browse" className="text-ui">
            {t("common.viewAll")}
          </ViewAllLink>
        </div>
        <div className="grid grid-cols-5 gap-x-1 gap-y-3 lg:grid-cols-10">
          {shortcuts.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                to={item.href}
                className="flex min-w-0 flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg bg-brand-soft text-brand",
                    item.active && "ring-2 ring-brand",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-navy">{t(item.key)}</span>
            </Link>
          )
        })}
        </div>
        </div>
      </Container>
    </section>
  )
}
