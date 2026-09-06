import { Eye, EyeOff } from "lucide-react"
import { useState, type InputHTMLAttributes, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  invalid?: boolean
  leading?: ReactNode
}

export function PasswordInput({ className, invalid, id, leading, ...props }: Props) {
  const t = useT()
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      {leading ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={cn(
          "h-11 w-full rounded-lg border bg-white pr-11 text-sm text-navy placeholder:text-navy-muted/80 focus:outline-none focus:ring-2 focus:ring-brand/20",
          leading ? "pl-10" : "pl-3",
          invalid ? "border-red-300 focus:border-red-400" : "border-line focus:border-brand/30",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-navy-muted hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
