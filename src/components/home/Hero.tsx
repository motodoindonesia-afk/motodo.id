import { ArrowRight } from "lucide-react"
import { heroImage } from "../../data/site"
import { Button } from "../ui/Button"
import { Container } from "../layout/Container"

export function Hero() {
  return (
    <section className="bg-white py-10 sm:py-14 lg:py-16">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            Find Your Next Ride
          </h1>
          <p className="mt-4 text-base leading-relaxed text-navy-muted sm:text-lg">
            Buy and sell custom & premium motorcycles in Indonesia.
          </p>
          <Button
            className="mt-7 px-5 py-3"
            onClick={() => {
              document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            Browse Motorcycles
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl bg-surface">
            <img
              src={heroImage}
              alt="Custom motorcycle parked against a concrete wall"
              className="aspect-[16/11] w-full object-cover"
            />
          </div>
          <p className="pointer-events-none absolute right-4 top-4 hidden text-[11px] font-medium tracking-[0.28em] text-navy/70 sm:block">
            BUILD
            <br />
            RIDE
            <br />
            SHARE
            <span className="mt-2 block h-px w-10 bg-navy/40" />
          </p>
        </div>
      </Container>
    </section>
  )
}
