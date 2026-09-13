import type { SupportedStorage } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"

/** SecureStore items are capped (~2KB). Auth session JSON is chunked below that limit. */
const CHUNK_SIZE = 1800

async function setItem(key: string, value: string) {
  const chunks = Math.max(1, Math.ceil(value.length / CHUNK_SIZE))
  await SecureStore.setItemAsync(`${key}.n`, String(chunks))
  for (let index = 0; index < chunks; index += 1) {
    const slice = value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
    await SecureStore.setItemAsync(`${key}.${index}`, slice)
  }
}

async function getItem(key: string) {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`)
  if (!countRaw) {
    return SecureStore.getItemAsync(key)
  }
  const count = Number(countRaw)
  if (!Number.isInteger(count) || count < 1) return null
  let value = ""
  for (let index = 0; index < count; index += 1) {
    value += (await SecureStore.getItemAsync(`${key}.${index}`)) ?? ""
  }
  return value
}

async function removeItem(key: string) {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`)
  if (countRaw) {
    const count = Number(countRaw)
    if (Number.isInteger(count) && count > 0) {
      for (let index = 0; index < count; index += 1) {
        await SecureStore.deleteItemAsync(`${key}.${index}`)
      }
    }
    await SecureStore.deleteItemAsync(`${key}.n`)
  }
  await SecureStore.deleteItemAsync(key)
}

export const secureAuthStorage: SupportedStorage = {
  getItem,
  setItem,
  removeItem,
}
