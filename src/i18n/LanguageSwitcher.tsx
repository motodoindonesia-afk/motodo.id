import { useEffect, useRef, useState } from "react"
import { ChevronDown, Globe } from "lucide-react"
import { useLanguage } from "./LanguageContext"
import type { Locale } from "./translations"

const OPTIONS: { value: Locale; key: "lang.indonesia" | "lang.english" }[] = [
  { value: "id", key: "lang.indonesia" },
  { value: "en", key: "lang.english" },
]

export function LanguageSwitcher({
  compact = true,
  tone = "onDark",
  align = "end",
  variant = "dropdown",
}: {
  compact?: boolean
  tone?: "onDark" | "onLight"
  align?: "start" | "end"
  variant?: "dropdown" | "list"
}) {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("mousedown", onPointer)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  const current = OPTIONS.find((item) => item.value === locale) ?? OPTIONS[0]

  if (variant === "list") {
    return (
      <div role="listbox" aria-label={t("lang.select")}>
        {OPTIONS.map((option) => {
          const selected = option.value === locale
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              className={`flex min-h-10 w-full items-center gap-2 text-left text-[14px] font-medium hover:text-brand ${selected ? "text-brand" : "text-navy"}`}
              onClick={() => setLocale(option.value)}
            >
              {option.value === "id" ? (
                <Globe className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <span className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{t(option.key)}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        className={
          compact && tone === "onDark"
            ? "inline-flex max-w-[11.5rem] items-center gap-1 text-white/90 hover:text-white"
            : "inline-flex max-w-[11.5rem] items-center gap-1 text-ui text-navy hover:text-brand"
        }
        aria-label={t("lang.select")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{t(current.key)}</span>
        <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={t("lang.select")}
          className={`absolute z-50 mt-1 min-w-[11.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-white py-1 text-navy shadow-sm ${align === "start" ? "left-0" : "right-0"}`}
        >
          {OPTIONS.map((option) => {
            const selected = option.value === locale
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`block w-full px-3 py-1.5 text-left text-ui hover:bg-surface ${selected ? "font-semibold text-brand" : ""}`}
                  onClick={() => {
                    setLocale(option.value)
                    setOpen(false)
                  }}
                >
                  {t(option.key)}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
