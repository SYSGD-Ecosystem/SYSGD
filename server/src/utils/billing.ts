export type UserTier = "free" | "pro" | "vip";

export const TIER_LIMITS: Record<
	UserTier,
	{
		max_projects: number;
		max_documents: number;
		max_task_per_projects: number;
		max_team_members: number;
		github_integration: boolean;
		bank_ideas: boolean;
		chat: boolean;
		custom_gemini_token: boolean;
		priority_support: boolean;
	}
> = {
	free: {
		max_projects: 3,
		max_documents: 5,
		max_task_per_projects: 250,
		max_team_members: 10,
		github_integration: false,
		bank_ideas: false,
		chat: false,
		custom_gemini_token: true,
		priority_support: false,
	},
	pro: {
		max_projects: -1,
		max_documents: -1,
		max_task_per_projects: -1,
		max_team_members: -1,
		github_integration: true,
		bank_ideas: true,
		chat: true,
		custom_gemini_token: true,
		priority_support: false,
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
		priority_support: true,
	},
};

export const TIER_CREDITS: Record<UserTier, number> = {
	free: 10,
	pro: 100,
	vip: 500,
};

export const createDefaultUserData = (tier: UserTier = "free") => {
	const now = new Date();
	const nextReset = new Date(now);
	nextReset.setMonth(nextReset.getMonth() + 1);

	return {
		billing: {
			tier,
			ai_task_credits: TIER_CREDITS[tier],
			purchased_credits: 0,
			limits: TIER_LIMITS[tier],
			billing_cycle: {
				last_reset: now.toISOString(),
				next_reset: nextReset.toISOString(),
			},
		},
	};
};

export const isValidTier = (value: string): value is UserTier =>
	value === "free" || value === "pro" || value === "vip";
