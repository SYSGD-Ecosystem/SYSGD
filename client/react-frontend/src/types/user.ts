export interface User {
  id: number
  name: string
  username: string
  password?: string // No la mostramos por seguridad
  privileges: "user" | "admin"
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
