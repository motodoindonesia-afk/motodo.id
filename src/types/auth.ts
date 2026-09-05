export type UserRole = "buyer" | "seller"

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: UserRole
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
