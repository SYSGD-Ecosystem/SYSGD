export interface User {
  id: number
  name: string
  username: string
  password?: string // No la mostramos por seguridad
  privileges: "user" | "admin"
}

export interface PublicUser {
  id: number
  name: string
  username: string
  avatar: string
  online: boolean
  isPublic: boolean
  type: "user" | "bot" | "agent"
  email: string
}

export interface CreateUserData {
  name: string
  username: string
  password: string
  privileges: "user" | "admin"
}

export interface UpdateUserData {
  name?: string
  username?: string
  password?: string
  privileges?: "user" | "admin"
}
