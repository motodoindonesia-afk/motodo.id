import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { cn } from "../../lib/cn"

type Props = {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const total = images.length
  const current = images[index] ?? images[0]

  function goTo(next: number) {
    if (total === 0) return
    setIndex((next + total) % total)
  }

  function handleTouchStart(clientX: number) {
    setTouchStart(clientX)
  }

  function handleTouchEnd(clientX: number) {
    if (touchStart === null) return
    const delta = clientX - touchStart
    if (delta > 40) goTo(index - 1)
    if (delta < -40) goTo(index + 1)
    setTouchStart(null)
  }

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl bg-surface"
        onTouchStart={(event) => handleTouchStart(event.changedTouches[0]?.clientX ?? 0)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <img
          src={current}
          alt={alt}
          className="aspect-[16/11] w-full object-cover"
        />
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ChevronRight className="size-5" />
            </button>
            <p className="absolute bottom-3 right-3 rounded-full bg-navy/70 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {total}
            </p>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <button
              key={`${image}-${imageIndex}`}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`View image ${imageIndex + 1}`}
              aria-current={imageIndex === index ? "true" : undefined}
              className={cn(
                "h-16 w-[88px] shrink-0 overflow-hidden rounded-lg bg-surface ring-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-[72px] sm:w-24",
                imageIndex === index ? "ring-2 ring-brand" : "ring-1 ring-transparent hover:ring-line",
              )}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
