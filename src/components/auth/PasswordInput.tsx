import { Eye, EyeOff } from "lucide-react"
import { useState, type InputHTMLAttributes } from "react"
import { cn } from "../../lib/cn"

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  invalid?: boolean
}

export function PasswordInput({ className, invalid, id, ...props }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={cn(
          "h-11 w-full rounded-lg border bg-white px-3 pr-11 text-sm text-navy placeholder:text-navy-muted/80 focus:outline-none focus:ring-2 focus:ring-brand/20",
          invalid ? "border-red-300 focus:border-red-400" : "border-line focus:border-brand/30",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-navy-muted hover:text-navy"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
