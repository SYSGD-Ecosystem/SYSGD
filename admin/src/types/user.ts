export type UserTier = "free" | "pro" | "vip"
export type UserPrivileges = "user" | "admin"
export type UserStatus = "active" | "invited" | "suspended" | "banned"

export type UserSegment =
	| "free"
	| "pro"
	| "vip"
	| "manual_license"
	| "trial_pro"
	| "inactive_1y"

export interface UserSegments {
	total: number
	admins: number
	regular: number
	free: number
	pro: number
	vip: number
	manualLicenseBuyers: number
	trialProActive: number
	inactiveOverYear: number
}

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
	is_public?: boolean
	created_at?: string
	registration_source?: string
	last_activity_at?: string | null
}

export interface AdminUsersPage {
	users: User[]
	total: number
	page: number
	pageSize: number
	totalPages: number
	summary: UserSegments
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
