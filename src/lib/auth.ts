import type { AuthUser, LoginInput, SignupInput, UserRole } from "../types/auth"

const SESSION_KEY = "motodo.session"
const USERS_KEY = "motodo.users"

const delay = (ms = 650) => new Promise((resolve) => window.setTimeout(resolve, ms))

function isValidCreatedAt(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

function normalizeUser(value: Partial<AuthUser> | null | undefined): AuthUser | null {
  if (!value?.id || !value.email || !value.fullName) return null
  if (value.role !== "buyer" && value.role !== "seller") return null
  return {
    id: value.id,
    fullName: value.fullName,
    email: value.email,
    role: value.role,
    phone: typeof value.phone === "string" ? value.phone : undefined,
    createdAt: isValidCreatedAt(value.createdAt) ? value.createdAt : new Date().toISOString(),
  }
}

function persistNormalized(user: AuthUser) {
  writeSession(user)
  const users = readUsers()
  const index = users.findIndex((item) => item.id === user.id)
  if (index === -1) writeUsers([...users, user])
  else writeUsers(users.map((item) => (item.id === user.id ? user : item)))
}

function readUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<AuthUser>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const user = normalizeUser(item)
      return user ? [user] : []
    })
  } catch {
    return []
  }
}

function writeUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function writeSession(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    const user = normalizeUser(parsed)
    if (!user) return null
    if (!isValidCreatedAt(parsed.createdAt)) persistNormalized(user)
    return user
  } catch {
    return null
  }
}

export function ensureUserExists(user: AuthUser) {
  const users = readUsers()
  if (users.some((item) => item.email === user.email || item.id === user.id)) return
  writeUsers([...users, user])
}

export async function signup(input: SignupInput): Promise<AuthUser> {
  await delay()
  const email = input.email.trim().toLowerCase()
  const users = readUsers()
  if (users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.")
  }

  const user: AuthUser = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    email,
    role: input.role,
    createdAt: new Date().toISOString(),
  }
  writeUsers([...users, user])
  writeSession(user)
  return user
}

export async function login(input: LoginInput): Promise<AuthUser> {
  await delay()
  const email = input.email.trim().toLowerCase()
  const users = readUsers()
  const user = users.find((item) => item.email === email)
  if (!user) {
    throw new Error("No account found for this email. Please sign up.")
  }
  writeSession(user)
  return user
}

export function logout() {
  writeSession(null)
}

export function updateCurrentUser(patch: Partial<Pick<AuthUser, "fullName" | "role" | "phone">>): AuthUser | null {
  const current = getCurrentUser()
  if (!current) return null
  const next = normalizeUser({ ...current, ...patch })
  if (!next) return null
  persistNormalized(next)
  return next
}

export function getUserById(id: string): AuthUser | null {
  return readUsers().find((user) => user.id === id) ?? null
}

export function listUsers(): AuthUser[] {
  return [...readUsers()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function displayName(user: AuthUser) {
  return user.fullName.split(" ")[0] || user.fullName
}

export function roleLabel(role: UserRole) {
  return role === "seller" ? "Seller" : "Buyer"
}
