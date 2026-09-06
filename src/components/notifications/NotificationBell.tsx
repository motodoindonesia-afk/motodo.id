import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  formatNotificationTime,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "../../lib/notifications"
import { getNotificationHref } from "../../lib/notificationLinks"
import { useNotificationsLive } from "../../lib/useNotificationsLive"
import { UnreadBadge } from "../chat/UnreadBadge"
import { NotificationTypeIcon } from "./NotificationTypeIcon"
import { cn } from "../../lib/cn"

export function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useNotificationsLive()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [])

  if (!user) return null
  const userId = user.id
  const unread = getUnreadNotificationCount(userId)
  const latest = getNotifications(userId).slice(0, 5)

  function openNotification(id: string, href: string | null) {
    void markNotificationAsRead(id, userId)
    setOpen(false)
    if (href) navigate(href)
    else navigate("/notifications")
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-navy hover:text-brand"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          if (window.matchMedia("(max-width: 1023px)").matches) {
            navigate("/notifications")
            return
          }
          setOpen((value) => !value)
        }}
      >
        <Bell className="size-5" aria-hidden="true" />
        <UnreadBadge count={unread} />
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-navy">Notifications</p>
            {unread > 0 ? <span className="text-xs text-navy-muted">{unread} unread</span> : null}
          </div>
          {latest.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-navy-muted">You're all caught up.</p>
          ) : (
            <ul>
              {latest.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left hover:bg-surface",
                      !item.read && "bg-surface/80",
                    )}
                    onClick={() => openNotification(item.id, getNotificationHref(item, userId))}
                  >
                    <NotificationTypeIcon type={item.type} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-navy">{item.title}</span>
                        {!item.read ? <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" /> : null}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-navy-muted">{item.message}</span>
                      <span className="mt-1 block text-xs text-navy-muted">{formatNotificationTime(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="block w-full border-t border-line px-4 py-3 text-center text-sm font-medium text-brand hover:bg-surface"
            onClick={() => {
              setOpen(false)
              navigate("/notifications")
            }}
          >
            View All Notifications
          </button>
        </div>
      ) : null}
    </div>
  )
}
