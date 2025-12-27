export interface User {
  id: string
  name: string
  email: string
  password?: string // No la mostramos por seguridad
  privileges: "user" | "admin"
  status?: "active" | "invited" | "suspended" | "banned"
}

export interface PublicUser {
  id: string
  name: string
  email: string
  avatar: string
  online: boolean
  isPublic: boolean
  type: "user" | "bot" | "agent"
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  privileges: "user" | "admin"
}

export interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  privileges?: "user" | "admin"
  status?: "active" | "invited" | "suspended" | "banned"
}
