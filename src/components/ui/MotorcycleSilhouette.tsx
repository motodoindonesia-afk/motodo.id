import type { Category } from "../../types/marketplace"

type Props = {
  variant: Category["variant"]
}

export function MotorcycleSilhouette({ variant }: Props) {
  const paths: Record<Category["variant"], string> = {
    cruiser:
      "M14 28c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm48 0c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM12 28h10l6-10h12l8 10h8M22 18l4-8h10l4 8M28 10h8",
    standard:
      "M16 30c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm48 0c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM14 30h12l8-12h10l8 12h8M28 18l2-8h12l6 8M34 10v-4",
    chopper:
      "M14 32c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm54-8c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM12 32h14l4-8 18-10 10 2M30 24l2-10h8M26 14h10",
    bobber:
      "M16 32c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm48 0c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM14 32h14l6-8h16l8 8h6M28 24c4-6 12-8 20-6M32 16h10",
    cafe:
      "M16 30c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm48 0c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM14 30h12l10-10 12 2 8 8h8M30 20l8-10h10l4 8M48 10l6-4",
    other:
      "M16 30c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm48 0c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM14 30h14l6-11h12l8 11h8M28 19h16M32 19l4-8h8",
  }

  return (
    <svg
      viewBox="0 0 72 42"
      className="h-8 w-14 text-navy"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={paths[variant]}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
