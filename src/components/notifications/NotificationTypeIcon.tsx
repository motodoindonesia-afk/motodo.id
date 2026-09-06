import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  MessageSquare,
  Package,
  ShoppingBag,
  Star,
  Tag,
  UserPlus,
} from "lucide-react"
import type { NotificationType } from "../../types/notification"

export function NotificationTypeIcon({ type }: { type: NotificationType }) {
  const className = "size-4 shrink-0 text-brand"
  if (type === "new_message") return <MessageSquare className={className} aria-hidden="true" />
  if (type === "new_order") return <ShoppingBag className={className} aria-hidden="true" />
  if (type === "order_confirmed") return <Check className={className} aria-hidden="true" />
  if (type === "order_completed") return <CheckCircle className={className} aria-hidden="true" />
  if (type === "order_cancelled") return <AlertTriangle className={className} aria-hidden="true" />
  if (type === "listing_sold") return <Tag className={className} aria-hidden="true" />
  if (type === "listing_low_inventory") return <Package className={className} aria-hidden="true" />
  if (type === "listing_status") return <Bell className={className} aria-hidden="true" />
  if (type === "review_reminder") return <Star className={className} aria-hidden="true" />
  if (type === "seller_approved") return <CheckCircle className={className} aria-hidden="true" />
  if (type === "seller_rejected") return <AlertTriangle className={className} aria-hidden="true" />
  return <UserPlus className={className} aria-hidden="true" />
}
