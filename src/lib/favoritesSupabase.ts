import type { Favorite, ToggleFavoriteResult } from "../types/favorite"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient } from "./supabase"

type FavoriteRow = {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

export function mapFavoriteRow(row: FavoriteRow): Favorite | null {
  if (!row.id || !row.user_id || !row.listing_id || !row.created_at) return null
  return {
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    createdAt: row.created_at,
  }
}

function asFavoriteRows(data: unknown): FavoriteRow[] {
  return Array.isArray(data) ? (data as FavoriteRow[]) : []
}

function asToggleResult(data: unknown): ToggleFavoriteResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const row = data as { listing_id?: unknown; favorited?: unknown }
  if (typeof row.listing_id !== "string") return null
  return {
    listingId: row.listing_id,
    favorited: row.favorited === true,
  }
}

export async function getMyFavorites(): Promise<Favorite[]> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("get_my_favorites")
  if (error) throwUserFacing(error, "Unable to load favorites.")
  return asFavoriteRows(data).flatMap((row) => {
    const favorite = mapFavoriteRow(row)
    return favorite ? [favorite] : []
  })
}

export async function toggleFavorite(listingId: string): Promise<ToggleFavoriteResult> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("toggle_favorite", { p_listing_id: listingId })
  if (error) throwUserFacing(error, "Unable to update favorites.")
  const result = asToggleResult(data)
  if (!result) throw new Error("Unable to update favorites.")
  return result
}

export function isFavorite(favorites: Favorite[], listingId: string) {
  return favorites.some((item) => item.listingId === listingId)
}
