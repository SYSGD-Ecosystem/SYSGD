import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

export type AnalyticsPeriod = "week" | "month" | "year";

export interface AnalyticsPoint {
	key: string;
	label: string;
	value: number;
}

export interface LoginAnalyticsPoint extends AnalyticsPoint {
	uniqueUsers: number;
}

export interface SourceCount {
	source: string;
	count: number;
}

export interface AdminAnalyticsUser {
	userId: string;
	nombre: string;
	email: string;
	registeredAt: string;
	registrationSource: string;
	lastLoginAt: string | null;
	loginsInPeriod: number;
	projectsCount: number;
	hasAccounting: boolean;
}

export interface AdminAnalyticsSummary {
	totalUsers: number;
	newUsersInPeriod: number;
	usersLoggedInPeriod: number;
	usersWithProjects: number;
	usersWithAccounting: number;
	usersWithBothModules: number;
	usersWithoutModules: number;
}

export interface AdminAnalytics {
	period: AnalyticsPeriod;
	generatedAt: string;
	startDate: string;
	endDate: string;
	summary: AdminAnalyticsSummary;
	registrationSeries: AnalyticsPoint[];
	loginSeries: LoginAnalyticsPoint[];
	registrationSources: SourceCount[];
	loginSources: SourceCount[];
	users: AdminAnalyticsUser[];
}

interface UseAdminAnalyticsReturn {
	analytics: AdminAnalytics | null;
	loading: boolean;
	error: string | null;
	period: AnalyticsPeriod;
	setPeriod: (value: AnalyticsPeriod) => void;
	anchorDate: Date;
	setAnchorDate: (date: Date) => void;
	refetch: () => Promise<void>;
}

export function useAdminAnalytics(
	initialPeriod: AnalyticsPeriod = "month",
): UseAdminAnalyticsReturn {
	const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [period, setPeriod] = useState<AnalyticsPeriod>(initialPeriod);
	const [anchorDate, setAnchorDate] = useState<Date>(new Date());

	const fetchAnalytics = useCallback(async () => {
		setLoading(true);
		try {
			const anchor = anchorDate.toISOString().slice(0, 10);
			const data = await apiFetch<AdminAnalytics>(
				`/api/admin/analytics?period=${period}&anchor=${anchor}`,
			);
			setAnalytics(data);
			setError(null);
		} catch (fetchError: unknown) {
			const message =
				fetchError instanceof Error
					? fetchError.message
					: "Error al obtener analíticas";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [period, anchorDate]);

	useEffect(() => {
		void fetchAnalytics();
	}, [fetchAnalytics]);

	return {
		analytics,
		loading,
		error,
		period,
		setPeriod,
		anchorDate,
		setAnchorDate,
		refetch: fetchAnalytics,
	};
}
