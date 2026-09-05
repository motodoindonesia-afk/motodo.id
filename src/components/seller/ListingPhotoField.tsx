import { useRef, useState } from "react"
import { fileToStoredImage, MAX_LISTING_PHOTOS } from "../../lib/listingImages"
import { Button } from "../ui/Button"
import { cn } from "../../lib/cn"

type Props = {
  images: string[]
  error?: string
  onChange: (images: string[]) => void
}

export function ListingPhotoField({ images, error, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState("")

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    const remaining = MAX_LISTING_PHOTOS - images.length
    if (remaining <= 0) {
      setLocalError("You can add up to 10 photos.")
      return
    }
    setBusy(true)
    setLocalError("")
    try {
      const files = Array.from(fileList).slice(0, remaining)
      const next: string[] = []
      for (const file of files) {
        next.push(await fileToStoredImage(file))
      }
      onChange([...images, ...next])
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Unable to add that photo.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const [photo] = next.splice(index, 1)
    next.splice(target, 0, photo)
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy">Add Photos</p>
          <p className="mt-1 text-xs text-navy-muted">Up to 10 photos. The first photo is the cover image.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={busy || images.length >= MAX_LISTING_PHOTOS}
        >
          {busy ? "Adding photos..." : "Add Photos"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((src, index) => (
            <li key={`${src.slice(0, 24)}-${index}`} className="overflow-hidden rounded-xl border border-line">
              <div className="relative aspect-[4/3] bg-surface">
                <img src={src} alt="" className="h-full w-full object-cover" />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-navy">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                <button
                  type="button"
                  className={cn("rounded-md px-2 py-1 text-xs text-navy hover:bg-surface")}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs text-navy hover:bg-surface"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="ml-auto rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-navy-muted">
          No photos yet. Add at least one image of the motorcycle.
        </p>
      )}

      {error || localError ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error || localError}
        </p>
      ) : null}
    </div>
  )
}
