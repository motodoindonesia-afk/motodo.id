/**
 * Browser-only listing photo resize (Canvas). Do not import from React Native.
 *
 * Web: File → this module → data URL/JPEG → uploadListingImage (Storage).
 * Mobile: native picker → native compression → Blob/bytes → uploadListingImage.
 * Shared: bucket + path in platform/listingStorage.ts. RLS unchanged.
 */

const MAX_EDGE = 1280
const JPEG_QUALITY = 0.72

export const MAX_LISTING_PHOTOS = 10

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Unable to read that image."))
    image.src = src
  })
}

export async function fileToStoredImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.")
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Unable to process that image.")
    context.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
