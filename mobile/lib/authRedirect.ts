let pendingNext: string | undefined
let pendingBuyNow: string | undefined

export function setPendingAuthRedirect(next?: string, buyNow?: string) {
  pendingNext = next
  pendingBuyNow = buyNow
}

export function consumePendingAuthRedirect() {
  const next = pendingNext
  const buyNow = pendingBuyNow
  pendingNext = undefined
  pendingBuyNow = undefined
  return { next, buyNow }
}
