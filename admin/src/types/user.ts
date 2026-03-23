export type UserTier = "free" | "pro" | "vip"
export type UserPrivileges = "user" | "admin"
export type UserStatus = "active" | "invited" | "suspended" | "banned"

export interface UserData {
	billing: {
		tier: UserTier
	}
}

export interface User {
	id: string
	name: string
	email: string
	privileges: UserPrivileges
	status: UserStatus
	user_data: UserData
}

export interface CreateUserData {
	name: string
	email: string
	password?: string
	privileges?: UserPrivileges
	status?: UserStatus
}

export interface UpdateUserData {
	name?: string
	email?: string
	password?: string
	privileges?: UserPrivileges
	status?: UserStatus
	user_data?: Partial<UserData>
}
