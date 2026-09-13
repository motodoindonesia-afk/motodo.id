import { Camera } from "lucide-react"
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react"
import { Button } from "../ui/Button"
import { useLanguage } from "../../i18n"
import { storeCoverValidationError } from "../../lib/platform/storeCover"
import { uploadSellerStoreCover } from "../../lib/sellerStoreCover"
import { fileToStoreCoverBlob } from "../../lib/storeCoverImage"
import { SellerStoreBanner } from "./SellerStoreBanner"

type Props = {
  businessName: string
  currentUrl: string | null
  canEdit: boolean
}

export function SellerStoreCoverEditor({ businessName, currentUrl, canEdit }: Props) {
  const { t } = useLanguage()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (window.location.hash !== "#store-cover") return
    document.getElementById("store-cover")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function resetPicker() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPendingFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError("")
    setSaved(false)
    if (!file) return
    const invalid = storeCoverValidationError({ type: file.type, size: file.size })
    if (invalid === "unsupported") {
      setError(t("seller.storeCoverUnsupported"))
      resetPicker()
      return
    }
    if (invalid === "too_large") {
      setError(t("seller.storeCoverTooLarge"))
      resetPicker()
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!pendingFile) return
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const blob = await fileToStoreCoverBlob(pendingFile)
      await uploadSellerStoreCover(blob)
      resetPicker()
      setSaved(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      if (message === "STORE_COVER_UNSUPPORTED") setError(t("seller.storeCoverUnsupported"))
      else if (message === "STORE_COVER_TOO_LARGE") setError(t("seller.storeCoverTooLarge"))
      else if (message === "STORE_COVER_NOT_APPROVED") setError(t("seller.storeCoverAfterVerify"))
      else setError(t("seller.storeCoverUploadFailed"))
    } finally {
      setSaving(false)
    }
  }

  const displayUrl = previewUrl || currentUrl

  return (
    <section id="store-cover" className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <h2 className="text-section font-semibold text-navy">{t("seller.storeCoverTitle")}</h2>
          <p className="mt-1 text-meta text-navy-muted">{t("seller.storeCoverHint")}</p>
        </div>
      </div>
      <div className="mt-3 px-4 pb-4">
        <SellerStoreBanner
          coverUrl={displayUrl}
          identity={
            <p className="text-ui font-semibold text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.85)]">{businessName}</p>
          }
        />
        {canEdit ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFile}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-3 py-1.5 text-ui"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-3.5" aria-hidden="true" />
              {t("seller.editStorePhoto")}
            </Button>
            {pendingFile ? (
              <>
                <Button type="button" className="h-9 px-3 py-1.5 text-ui" disabled={saving} onClick={() => void handleSave()}>
                  {saving ? t("form.saving") : t("seller.storeCoverSave")}
                </Button>
                <Button
                  type="button"
                  variant="text"
                  className="h-9 px-2 text-ui"
                  disabled={saving}
                  onClick={() => {
                    resetPicker()
                    setError("")
                    setSaved(false)
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-meta text-navy-muted">{t("seller.storeCoverAfterVerify")}</p>
        )}
        {error ? (
          <p className="mt-2 text-[12px] text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="mt-2 text-[12px] text-brand" role="status">
            {t("seller.storeCoverSaved")}
          </p>
        ) : null}
      </div>
    </section>
  )
}
