/**
 * Browser-only store-cover resize (Canvas). Do not import from React Native.
 *
 * Web: File → this module → Blob → uploadSellerStoreCover.
 * Mobile: native picker → native compression → Blob → uploadSellerStoreCover.
 * Shared: bucket + path in platform/storeCover.ts. RLS unchanged.
 */

const MAX_WIDTH = 1920
const MAX_HEIGHT = 720
const WEBP_QUALITY = 0.82
const JPEG_QUALITY = 0.84

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Unable to read that image."))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to process that image."))
          return
        }
        resolve(blob)
      },
      type,
      quality,
    )
  })
}

export async function fileToStoreCoverBlob(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const scale = Math.min(1, MAX_WIDTH / image.width, MAX_HEIGHT / image.height)
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Unable to process that image.")
    context.drawImage(image, 0, 0, width, height)

    try {
      const webp = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY)
      if (webp.size > 0) return webp
    } catch {
      /* Safari or older engines may omit WebP encoding. */
    }
    return canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
