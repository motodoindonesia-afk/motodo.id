import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import { useEffect, useState, type KeyboardEvent } from "react"
import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

type Props = {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: Props) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [broken, setBroken] = useState<Record<number, true>>({})
  const usable = images.filter((src) => src.trim())
  const total = usable.length
  const current = usable[index] ?? usable[0]
  const currentBroken = Boolean(current && broken[index])

  useEffect(() => {
    setIndex(0)
    setBroken({})
  }, [usable.join("|")])

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

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (total <= 1) return
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      goTo(index - 1)
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      goTo(index + 1)
    }
  }

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        tabIndex={total > 1 ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onTouchStart={(event) => handleTouchStart(event.changedTouches[0]?.clientX ?? 0)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        {current && !currentBroken ? (
          <img
            src={current}
            alt={alt}
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/11]"
            fetchPriority="high"
            onError={() => setBroken((value) => ({ ...value, [index]: true }))}
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 text-navy-muted sm:aspect-[16/11]">
            <ImageOff className="size-8" aria-hidden="true" />
            <p className="text-sm">{t("listing.imageUnavailable")}</p>
          </div>
        )}
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label={t("listing.prevImage")}
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label={t("listing.nextImage")}
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ChevronRight className="size-5" />
            </button>
            <p className="absolute bottom-3 right-3 rounded-full bg-navy/70 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {total}
            </p>
          </>
        ) : total === 1 ? (
          <p className="absolute bottom-3 right-3 rounded-full bg-navy/70 px-2.5 py-1 text-xs font-medium text-white">
            1 / 1
          </p>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {usable.map((image, imageIndex) => (
            <button
              key={`${image}-${imageIndex}`}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={t("listing.viewImage", { n: imageIndex + 1 })}
              aria-current={imageIndex === index ? "true" : undefined}
              className={cn(
                "h-16 w-[88px] shrink-0 overflow-hidden rounded-lg bg-surface ring-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-[72px] sm:w-24",
                imageIndex === index ? "ring-2 ring-brand" : "ring-1 ring-transparent hover:ring-line",
              )}
            >
              {broken[imageIndex] ? (
                <span className="flex h-full w-full items-center justify-center text-navy-muted">
                  <ImageOff className="size-4" aria-hidden="true" />
                </span>
              ) : (
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => setBroken((value) => ({ ...value, [imageIndex]: true }))}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
