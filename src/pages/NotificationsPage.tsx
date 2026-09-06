import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/Button"
import { Container } from "../components/layout/Container"
import { NotificationTypeIcon } from "../components/notifications/NotificationTypeIcon"
import {
  formatNotificationTime,
  getNotifications,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationAsUnread,
} from "../lib/notifications"
import { getNotificationHref } from "../lib/notificationLinks"
import { useNotificationsLive } from "../lib/useNotificationsLive"
import { cn } from "../lib/cn"
import { useT } from "../i18n"

export function NotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const t = useT()
  useNotificationsLive()
  const [filter, setFilter] = useState<"all" | "unread">("all")

  if (!user) return null
  const all = getNotifications(user.id)
  const unread = getUnreadNotifications(user.id)
  const visible = filter === "unread" ? unread : all

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-navy">{t("notify.title")}</h1>
              <p className="mt-2 text-navy-muted">{t("notify.subtitle")}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void markAllNotificationsAsRead(user.id)}
              disabled={unread.length === 0}
            >
              {t("notify.markAll")}
            </Button>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                filter === "all" ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
              )}
              onClick={() => setFilter("all")}
            >
              {t("notify.all")}
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                filter === "unread" ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
              )}
              onClick={() => setFilter("unread")}
            >
              {t("notify.unread")}
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line px-5 py-10 text-center">
              <p className="text-sm text-navy-muted">
                {filter === "unread" ? t("notify.emptyUnread") : t("notify.emptyAll")}
              </p>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              {visible.map((item) => (
                <li key={item.id} className={cn(!item.read && "bg-brand-soft")}>
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 gap-3 text-left"
                      onClick={() => {
                        void markNotificationAsRead(item.id, user.id)
                        const href = getNotificationHref(item, user.id)
                        if (href) navigate(href)
                      }}
                    >
                      <NotificationTypeIcon type={item.type} />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-navy">{item.title}</span>
                          {!item.read ? (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                              {t("notify.unread")}
                            </span>
                          ) : (
                            <span className="text-[11px] text-navy-muted">{t("notify.read")}</span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-navy-muted">{item.message}</span>
                        <span className="mt-1 block text-xs text-navy-muted">{formatNotificationTime(item.createdAt)}</span>
                      </span>
                    </button>
                    {item.read ? (
                      <Button
                        variant="secondary"
                        className="shrink-0 self-start text-xs"
                        onClick={() => void markNotificationAsUnread(item.id, user.id)}
                      >
                        {t("notify.markUnread")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </main>
  )
}
