// // export interface User {
// // 	id: string;
// // 	name: string;
// // 	email: string;
// // 	password?: string; // No la mostramos por seguridad
// // 	privileges: "user" | "admin";
// // 	status?: "active" | "invited" | "suspended" | "banned";
// // 	user_data: string
// // }

// // export interface PublicUser {
// // 	id: string;
// // 	name: string;
// // 	email: string;
// // 	avatar: string;
// // 	online: boolean;
// // 	isPublic: boolean;
// // 	type: "user" | "bot" | "agent";
// // }

// // export interface CreateUserData {
// // 	name: string;
// // 	email: string;
// // 	password: string;
// // 	privileges: "user" | "admin";
// // 	status: "active" | "invited" | "suspended" | "banned";
// // 	user_data: {tier: "free" | "pro" | "vip"}
// // }

// // export interface UpdateUserData {
// // 	name?: string;
// // 	email?: string;
// // 	password?: string;
// // 	privileges?: "user" | "admin";
// // 	status?: "active" | "invited" | "suspended" | "banned";
// // }

// // types/user.ts

// export interface BillingLimits {
// 	max_projects: number;
// 	max_documents: number;
// 	max_task_per_projects: number;
// 	max_team_members: number;
// 	github_integration: boolean;
// 	bank_ideas: boolean;
// 	chat: boolean;
// 	custom_gemini_token: boolean;
// 	priority_support: boolean;
// }

// export interface BillingCycle {
// 	last_reset: string;
// 	next_reset: string;
// }

// export interface BillingData {
// 	tier: "free" | "pro" | "vip";
// 	ai_task_credits: number;
// 	purchased_credits: number;
// 	limits: BillingLimits;
// 	billing_cycle: BillingCycle;
// }

// export interface CustomTokens {
// 	gemini?: string;
// }

// export interface UserData {
// 	billing: BillingData;
// 	custom_tokens?: CustomTokens;
// }

// export interface User {
// 	id: string;
// 	name: string;
// 	email: string;
// 	privileges: "user" | "admin";
// 	status: "active" | "invited" | "suspended" | "banned";
// 	is_public: boolean;
// 	user_data: UserData;
// 	created_at: string;
// }

// export interface CreateUserData {
// 	name: string;
// 	email: string;
// 	password: string;
// 	privileges?: "user" | "admin";
// 	status?: "active" | "invited" | "suspended" | "banned";
// }

// export interface UpdateUserData {
// 	name?: string;
// 	email?: string;
// 	password?: string;
// 	privileges?: "user" | "admin";
// 	status?: "active" | "invited" | "suspended" | "banned";
// 	user_data?: Partial<UserData>;
// }

// export interface PublicUser {
// 	id: string;
// 	name: string;
// 	email: string;
// 	is_public: boolean;
// 	avatar: string;
// 	online: boolean;
// 	isPublic: boolean;
// 	type: "user" | "bot" | "agent";
// }

// Valores por defecto
// export const DEFAULT_BILLING_LIMITS: Record<
// 	BillingData["tier"],
// 	BillingLimits
// > = {
// 	free: {
// 		max_projects: 3,
// 		max_documents: 5,
// 		max_task_per_projects: 250,
// 		max_team_members: 10,
// 		github_integration: false,
// 		bank_ideas: false,
// 		chat: false,
// 		custom_gemini_token: true,
// 		priority_support: false,
// 	},
// 	pro: {
// 		max_projects: -1, // ilimitado
// 		max_documents: -1,
// 		max_task_per_projects: -1,
// 		max_team_members: -1,
// 		github_integration: true,
// 		bank_ideas: true,
// 		chat: true,
// 		custom_gemini_token: true,
// 		priority_support: false,
// 	},
// 	vip: {
// 		max_projects: -1,
// 		max_documents: -1,
// 		max_task_per_projects: -1,
// 		max_team_members: -1,
// 		github_integration: true,
// 		bank_ideas: true,
// 		chat: true,
// 		custom_gemini_token: true,
// 		priority_support: true,
// 	},
// };

// export const DEFAULT_USER_DATA: UserData = {
// 	billing: {
// 		tier: "free",
// 		ai_task_credits: 5,
// 		purchased_credits: 0,
// 		limits: DEFAULT_BILLING_LIMITS.free,
// 		billing_cycle: {
// 			last_reset: new Date().toISOString(),
// 			next_reset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
// 		},
// 	},
// 	custom_tokens: {
// 		gemini: "",
// 	},
// };





// ============================================
// TIPOS BASE
// ============================================

export type UserTier = "free" | "pro" | "vip";
export type UserPrivileges = "user" | "admin";
export type UserStatus = "active" | "invited" | "suspended" | "banned";

// ============================================
// ESTRUCTURA DE USER_DATA (JSONB)
// ============================================

export interface BillingLimits {
  max_projects: number;
  max_documents: number;
  max_task_per_projects: number;
  max_team_members: number;
  github_integration: boolean;
  bank_ideas: boolean;
  chat: boolean;
  custom_gemini_token?: boolean;
  priority_support: boolean;
}

export interface BillingCycle {
  last_reset: string; // ISO date string
  next_reset: string; // ISO date string
}

export interface BillingData {
  tier: UserTier;
  ai_task_credits: number;
  purchased_credits: number;
  limits: BillingLimits;
  billing_cycle: BillingCycle;
}

export interface CustomTokens {
  gemini?: string;
}

export interface UserData {
  billing: BillingData;
  // Los tokens ahora se gestionan en la tabla user_tokens separada
}

// ============================================
// ENTIDAD USUARIO COMPLETA
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // No retornado desde el backend
  privileges: UserPrivileges;
  status: UserStatus;
  is_public: boolean;
  user_data: UserData;
  created_at: string; // ISO date string
}

// ============================================
// DTOs PARA OPERACIONES
// ============================================

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  privileges?: UserPrivileges;
  status?: UserStatus;
  user_data?: Partial<UserData>;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  privileges?: UserPrivileges;
  status?: UserStatus;
  user_data?: Partial<UserData>;
}

export interface UpdatePlanData {
  tier?: UserTier;
  credits?: number;
}

export interface AddCreditsData {
  amount: number;
  isPurchase?: boolean;
}

// ============================================
// RESPUESTAS DE API
// ============================================

export interface PlanInfoResponse {
  tier: UserTier;
  credits: {
    available: number;
    purchased: number;
    next_reset?: string;
  };
  limits: BillingLimits;
  hasCustomToken: boolean;
}

export interface CreditsResponse {
  message: string;
  added: number;
  total: number;
  purchased: number;
}

// ============================================
// TIPOS PARA UI
// ============================================

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  type: "user" | "agent" | "bot",
  online: boolean,
  isPublic: boolean
  avatar: string;
}

// Stats para el dashboard de admin
export interface UserStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  activeUsers: number;
  suspendedUsers: number;
}

// ============================================
// CONSTANTES Y DEFAULTS
// ============================================

export const DEFAULT_BILLING_LIMITS: Record<UserTier, BillingLimits> = {
  free: {
    max_projects: 3,
    max_documents: 5,
    max_task_per_projects: 250,
    max_team_members: 10,
    github_integration: false,
    bank_ideas: false,
    chat: false,
    custom_gemini_token: true,
    priority_support: false
  },
  pro: {
    max_projects: -1, // -1 = unlimited
    max_documents: -1,
    max_task_per_projects: -1,
    max_team_members: -1,
    github_integration: true,
    bank_ideas: true,
    chat: true,
    custom_gemini_token: true,
    priority_support: false
  },
  vip: {
    max_projects: -1,
    max_documents: -1,
    max_task_per_projects: -1,
    max_team_members: -1,
    github_integration: true,
    bank_ideas: true,
    chat: true,
    custom_gemini_token: true,
    priority_support: true
  }
};

export const TIER_CREDITS: Record<UserTier, number> = {
  free: 5,
  pro: 100,
  vip: 500
};

// ============================================
// TYPE GUARDS
// ============================================

export function isValidTier(tier: string): tier is UserTier {
  return ["free", "pro", "vip"].includes(tier);
}

export function isValidPrivileges(privileges: string): privileges is UserPrivileges {
  return ["user", "admin"].includes(privileges);
}

export function isValidStatus(status: string): status is UserStatus {
  return ["active", "invited", "suspended", "banned"].includes(status);
}

// ============================================
// HELPERS
// ============================================

export function createDefaultUserData(tier: UserTier = "free"): UserData {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    billing: {
      tier,
      ai_task_credits: TIER_CREDITS[tier],
      purchased_credits: 0,
      limits: DEFAULT_BILLING_LIMITS[tier],
      billing_cycle: {
        last_reset: now.toISOString(),
        next_reset: nextMonth.toISOString()
      }
    }
  };
}

export function mergeUserData(
  current: UserData | undefined,
  updates: Partial<UserData>
): UserData {
  const defaultData = createDefaultUserData();
  
  return {
    billing: {
      ...defaultData.billing,
      ...(current?.billing || {}),
      ...(updates?.billing || {}),
      limits: {
        ...defaultData.billing.limits,
        ...(current?.billing?.limits || {}),
        ...(updates?.billing?.limits || {})
      },
      billing_cycle: {
        ...defaultData.billing.billing_cycle,
        ...(current?.billing?.billing_cycle || {}),
        ...(updates?.billing?.billing_cycle || {})
      }
    }
  };
}


export function normalizeUser(user: {
  user_data?: Partial<UserData>;
} & Omit<User, "user_data">): User {
  return {
    ...user,
    user_data: {
      billing: {
        tier: user.user_data?.billing?.tier ?? "free",
        ai_task_credits:
          user.user_data?.billing?.ai_task_credits ??
          0,
        purchased_credits:
          user.user_data?.billing?.purchased_credits ??
          0,
        limits:
          user.user_data?.billing?.limits ??
          DEFAULT_BILLING_LIMITS[
			user.user_data?.billing?.tier ?? "free"
		  ],
        billing_cycle:
          user.user_data?.billing?.billing_cycle ??
          {
			last_reset: new Date().toISOString(),
			next_reset: new Date(
			  Date.now() + 30 * 24 * 60 * 60 * 1000
			).toISOString(),
		}
      },
      
    },
  };
}
