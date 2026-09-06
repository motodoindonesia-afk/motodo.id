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

const shortcuts: { label: string; href: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Semua Kategori", href: "/browse", icon: LayoutGrid, active: true },
  { label: "Motor Custom", href: "/browse?category=Chopper", icon: Wrench },
  { label: "Motor Klasik", href: "/browse?q=klasik", icon: Bike },
  { label: "Motor Premium", href: "/browse?q=premium", icon: Star },
  { label: "Aksesoris", href: "/browse?q=Aksesoris", icon: Sparkles },
  { label: "Apparel", href: "/browse?q=Apparel", icon: Shirt },
  { label: "Sparepart", href: "/browse?q=Sparepart", icon: Settings },
  { label: "Helm", href: "/browse?q=Helm", icon: HardHat },
  { label: "Perawatan", href: "/browse?q=Perawatan", icon: Droplets },
  { label: "Promo", href: "/browse", icon: Percent },
  { label: "Elektronik", href: "/browse?q=Elektronik", icon: Cpu },
  { label: "Perlengkapan Riding", href: "/browse?q=Perlengkapan%20Riding", icon: HardHat },
  { label: "Ban & Velg", href: "/browse?q=Ban", icon: CircleDot },
  { label: "Oli & Cairan", href: "/browse?q=Oli", icon: Droplets },
  { label: "Perlengkapan Bengkel", href: "/browse?q=Bengkel", icon: Hammer },
  { label: "Perawatan & Kecantikan", href: "/browse?q=Perawatan", icon: Sparkles },
  { label: "Apparel Pria", href: "/browse?q=Apparel", icon: Shirt },
  { label: "Apparel Wanita", href: "/browse?q=Apparel", icon: User },
  { label: "Miniatur & Hobi", href: "/browse?q=Miniatur", icon: Puzzle },
  { label: "Lainnya", href: "/browse", icon: MoreHorizontal },
]

export function CategoryGrid() {
  return (
    <section id="categories" className="pb-5">
      <Container>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-section font-semibold text-navy">Kategori</h2>
          <ViewAllLink href="/browse" className="text-ui">
            Lihat Semua
          </ViewAllLink>
        </div>
        <div className="grid grid-cols-5 gap-x-1 gap-y-3 lg:grid-cols-10">
          {shortcuts.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
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
                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-navy">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
