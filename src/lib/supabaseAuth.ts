import type { User } from "@supabase/supabase-js"
import type { AuthUser, LoginInput, SignupInput, UserRole } from "../types/auth"
import type { MotodoProfile, PrivilegeRole } from "../types/profile"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient } from "./supabase"

type ProfileRow = {
  id: string
  full_name: string
  account_type: string
  role: string
  created_at: string
  updated_at: string
}

function isAccountType(value: string): value is UserRole {
  return value === "buyer" || value === "seller"
}

function isPrivilege(value: string): value is PrivilegeRole {
  return value === "user" || value === "admin"
}

function mapProfile(row: ProfileRow): MotodoProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    accountType: isAccountType(row.account_type) ? row.account_type : "buyer",
    role: isPrivilege(row.role) ? row.role : "user",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function authUserFromProfile(authUser: User, profile: MotodoProfile): AuthUser {
  return {
    id: authUser.id,
    fullName: profile.fullName,
    email: authUser.email ?? "",
    role: profile.accountType,
    privilege: profile.role,
    createdAt: profile.createdAt,
  }
}

function authMessage(error: { message: string } | null): string {
  const message = error?.message ?? "Unable to authenticate."
  const lower = message.toLowerCase()
  if (lower.includes("invalid login")) return "Incorrect email or password."
  if (lower.includes("already registered")) return "An account with this email already exists."
  if (lower.includes("email not confirmed")) return "Confirm your email before logging in."
  return message
}

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const client = getSupabaseClient()
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle()
  if (error) throwUserFacing(error, "Unable to load your profile.")
  return data as ProfileRow | null
}

export async function fetchMotodoProfile(userId: string): Promise<MotodoProfile | null> {
  const row = await fetchProfileRow(userId)
  return row ? mapProfile(row) : null
}

async function fetchProfileWithRetry(userId: string): Promise<MotodoProfile> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const profile = await fetchMotodoProfile(userId)
    if (profile) return profile
    await new Promise((resolve) => window.setTimeout(resolve, 200))
  }
  throw new Error("Your account was created but the profile is not ready yet. Try logging in again.")
}

export async function loadSessionUser(): Promise<{ user: AuthUser; profile: MotodoProfile } | null> {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()
  if (error) throw new Error(authMessage(error))
  const sessionUser = data.session?.user
  if (!sessionUser) return null
  const profile = await fetchMotodoProfile(sessionUser.id)
  if (!profile) return null
  return { user: authUserFromProfile(sessionUser, profile), profile }
}

export async function supabaseSignup(input: SignupInput): Promise<{ user: AuthUser; profile: MotodoProfile }> {
  const client = getSupabaseClient()
  const email = input.email.trim().toLowerCase()
  const accountType: UserRole = input.role === "seller" ? "seller" : "buyer"
  const { data, error } = await client.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        account_type: accountType,
      },
    },
  })
  if (error) throw new Error(authMessage(error))
  if (!data.user) throw new Error("Unable to create account.")
  if (!data.session) {
    throw new Error("Account created. Confirm your email, then log in.")
  }
  const profile = await fetchProfileWithRetry(data.user.id)
  return { user: authUserFromProfile(data.user, profile), profile }
}

export async function supabaseLogin(input: LoginInput): Promise<{ user: AuthUser; profile: MotodoProfile }> {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  })
  if (error) throw new Error(authMessage(error))
  if (!data.user) throw new Error("Unable to log in.")
  const profile = await fetchProfileWithRetry(data.user.id)
  return { user: authUserFromProfile(data.user, profile), profile }
}

export async function supabaseLogout() {
  const client = getSupabaseClient()
  const { error } = await client.auth.signOut()
  if (error) throw new Error(authMessage(error))
}

export async function supabaseUpdateProfile(patch: {
  fullName?: string
  accountType?: UserRole
}): Promise<MotodoProfile> {
  const client = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw new Error(authMessage(sessionError))
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("You must be logged in to update your profile.")

  const updates: Record<string, string> = {}
  if (typeof patch.fullName === "string") updates.full_name = patch.fullName.trim()
  if (patch.accountType) updates.account_type = patch.accountType
  if (Object.keys(updates).length === 0) {
    const current = await fetchMotodoProfile(userId)
    if (!current) throw new Error("Profile not found.")
    return current
  }

  const { data, error } = await client.from("profiles").update(updates).eq("id", userId).select("*").single()
  if (error) throwUserFacing(error, "Unable to update your profile.")
  return mapProfile(data as ProfileRow)
}

export function subscribeSupabaseAuth(onChange: () => void) {
  const client = getSupabaseClient()
  const { data } = client.auth.onAuthStateChange(() => {
    onChange()
  })
  return () => data.subscription.unsubscribe()
}
