import type { UserRole } from "./auth"

export type PrivilegeRole = "user" | "admin"

export type MotodoProfile = {
  id: string
  fullName: string
  accountType: UserRole
  role: PrivilegeRole
  createdAt: string
  updatedAt: string
}
