export type UserTier = "free" | "pro" | "vip"
export type UserPrivileges = "user" | "admin"
export type UserStatus = "active" | "invited" | "suspended" | "banned"

export interface UserData {
	billing: {
		tier: UserTier
		ai_task_credits?: number
		plan_credits?: number
		purchased_credits?: number
		plan_validity?: {
			started_at: string
			expires_at: string
			duration_months: 1 | 3 | 12
		} | null
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
	user_data?: Partial<UserData>
}

export interface UpdateUserData {
	name?: string
	email?: string
	password?: string
	privileges?: UserPrivileges
	status?: UserStatus
	user_data?: Partial<UserData>
}

export interface UpdateUserPlanData {
	tier: UserTier
	durationMonths?: 1 | 3 | 12
	credits?: number
}
