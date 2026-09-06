/** Internal Ritme console routes. Not used by the public Motodo marketplace. */
export const OPS = {
  login: "/login",
  dashboard: "/dashboard",
  users: "/users",
  user: (id: string) => `/users/${id}`,
  sellers: "/sellers",
  seller: (id: string) => `/sellers/${id}`,
  listings: "/listings",
  listing: (id: string) => `/listings/${id}`,
  orders: "/orders",
  order: (id: string) => `/orders/${id}`,
  reviews: "/reviews",
  review: (id: string) => `/reviews/${id}`,
  settings: "/settings",
} as const

/** Public Motodo origin for cross-app links from Ritme. Not a second backend. */
export function motodoPublicOrigin() {
  const raw = import.meta.env.VITE_MOTODO_PUBLIC_ORIGIN
  if (typeof raw === "string" && raw.trim()) return raw.trim().replace(/\/$/, "")
  return "https://motodo.id"
}

export function motodoPublicHref(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${motodoPublicOrigin()}${normalized}`
}
