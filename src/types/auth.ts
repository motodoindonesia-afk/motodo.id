export type UserRole = "buyer" | "seller"

/** Authorization privilege. Separate from buyer/seller account type. */
export type PrivilegeRole = "user" | "admin"

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: UserRole
  /** Set in Supabase mode from profiles.role. Mock admin still uses email until Phase B SQL is applied. */
  privilege?: PrivilegeRole
  phone?: string
  createdAt: string
}

export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}
