export const PRODUCTS = {
	credits_10: {
		price: 5_000_000,
		description: "10 AI Credits",
		active: true,
	},
	credits_50: {
		price: 20_000_000,
		description: "50 AI Credits",
		active: true,
	},
	credits_100: {
		price: 35_000_000,
		description: "100 AI Credits",
		active: true,
	},
	credits_500: {
		price: 150_000_000,
		description: "500 AI Credits",
		active: true,
	},
	plan_pro_monthly: {
		price: 10_000_000,
		description: "Pro Plan - Monthly",
		active: true,
	},
	plan_vip_monthly: {
		price: 25_000_000,
		description: "VIP Plan - Monthly",
		active: true,
	},
	plan_pro_yearly: {
		price: 100_000_000,
		description: "Pro Plan - Yearly",
		active: true,
	},
	plan_vip_yearly: {
		price: 250_000_000,
		description: "VIP Plan - Yearly",
		active: true,
	},
} as const;

export type ProductId = keyof typeof PRODUCTS;
