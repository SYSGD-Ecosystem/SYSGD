import { pool } from "../db";

export interface GeneralMetrics {
	totalUsers: number;
	totalProjects: number;
	totalTasks: number;
	totalRegistrosContables: number;
}

export interface UsuarioContabilidad {
	userId: string;
	nombre: string;
	email: string;
	tieneRegistro: boolean;
	creditos: number;
	ultimoUpdate: string | null;
}

export interface ContabilidadMetrics {
	usuariosActivos: number;
	totalRegistros: number;
	usuarios: UsuarioContabilidad[];
}

export interface UsuarioProyectos {
	userId: string;
	nombre: string;
	email: string;
	proyectosCount: number;
	tareasCount: number;
	creditos: number;
}

export interface ProyectosMetrics {
	usuarios: UsuarioProyectos[];
}

export interface AdminMetrics {
	general: GeneralMetrics;
	contabilidad: ContabilidadMetrics;
	proyectos: ProyectosMetrics;
}

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

type UserCreditsRow = {
	credits_raw: string | null;
};

type GeneralMetricsRow = {
	total_users: string;
	total_projects: string;
	total_tasks: string;
	total_registros: string;
};

type ContabilidadRow = {
	user_id: string;
	name: string | null;
	email: string;
	ultimo_update: string | null;
	tiene_registro: boolean;
	credits_raw: string | null;
};

type ProyectosRow = {
	user_id: string;
	name: string | null;
	email: string;
	proyectos_count: string;
	tareas_count: string;
	credits_raw: string | null;
};

type BucketValueRow = {
	bucket_key: string;
	total: string;
};

type LoginBucketValueRow = BucketValueRow & {
	unique_users: string;
};

type SourceCountRow = {
	source: string | null;
	total: string;
};

type SummaryRow = {
	total_users: string;
	new_users_in_period: string;
	users_logged_in_period: string;
};

type UsageSummaryRow = {
	users_with_projects: string;
	users_with_accounting: string;
	users_with_both_modules: string;
	users_without_modules: string;
};

type AnalyticsUserRow = {
	user_id: string;
	name: string | null;
	email: string;
	created_at: string;
	registration_source: string | null;
	last_login_at: string | null;
	logins_in_period: string;
	projects_count: string;
	has_accounting: boolean;
};

const toInt = (value: string | number | null | undefined): number => {
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	if (typeof value !== "string") return 0;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : 0;
};

const toSourceLabel = (source: string | null | undefined): string => {
	switch ((source || "").toLowerCase()) {
		case "main_web":
			return "Módulo principal (web)";
		case "sysgd_cont_web":
			return "Contabilidad (web)";
		case "sysgd_cont_android":
			return "Contabilidad (android)";
		case "admin_panel":
			return "Panel admin";
		default:
			return "No especificado";
	}
};

const dayKey = (date: Date): string =>
	`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
		date.getUTCDate(),
	).padStart(2, "0")}`;
const monthKey = (date: Date): string =>
	`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const parseAnchorDate = (value?: string): Date => {
	if (!value) return new Date();
	const parsed = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(parsed.getTime())) return new Date();
	return parsed;
};

const getAnalyticsRange = (
	period: AnalyticsPeriod,
	anchorDate?: string,
): { startDate: Date; endDate: Date } => {
	const anchor = parseAnchorDate(anchorDate);
	const endDate = new Date(
		Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate(), 23, 59, 59, 999),
	);
	const startDate = new Date(endDate);

	if (period === "week") {
		startDate.setUTCDate(startDate.getUTCDate() - 6);
		startDate.setUTCHours(0, 0, 0, 0);
		return { startDate, endDate };
	}

	if (period === "month") {
		startDate.setUTCDate(startDate.getUTCDate() - 29);
		startDate.setUTCHours(0, 0, 0, 0);
		return { startDate, endDate };
	}

	startDate.setUTCDate(1);
	startDate.setUTCHours(0, 0, 0, 0);
	startDate.setUTCMonth(startDate.getUTCMonth() - 11);
	return { startDate, endDate };
};

const buildBuckets = (
	period: AnalyticsPeriod,
	startDate: Date,
): Array<{ key: string; label: string; date: Date }> => {
	const buckets: Array<{ key: string; label: string; date: Date }> = [];

	if (period === "year") {
		const formatter = new Intl.DateTimeFormat("es-ES", { month: "short" });
		const base = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
		for (let index = 0; index < 12; index += 1) {
			const current = new Date(base);
			current.setUTCMonth(base.getUTCMonth() + index);
			buckets.push({
				key: monthKey(current),
				label: formatter.format(current),
				date: current,
			});
		}
		return buckets;
	}

	const amount = period === "week" ? 7 : 30;
	const formatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" });
	for (let index = 0; index < amount; index += 1) {
		const current = new Date(startDate);
		current.setUTCDate(startDate.getUTCDate() + index);
		buckets.push({
			key: dayKey(current),
			label: formatter.format(current),
			date: current,
		});
	}

	return buckets;
};

async function getUserCredits(userId: string): Promise<number> {
	try {
		const { rows } = await pool.query<UserCreditsRow>(
			"SELECT user_data->'billing'->>'ai_task_credits' as credits_raw FROM users WHERE id = $1",
			[userId],
		);
		return toInt(rows[0]?.credits_raw);
	} catch {
		return 0;
	}
}

export async function getGeneralMetrics(): Promise<GeneralMetrics> {
	const result = await pool.query<GeneralMetricsRow>(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE privileges != 'admin') as total_users,
      (SELECT COUNT(*) FROM projects) as total_projects,
      (SELECT COUNT(*) FROM tasks) as total_tasks,
      (SELECT COUNT(*) FROM cont_ledger_records) as total_registros
  `);

	const row = result.rows[0];
	return {
		totalUsers: toInt(row?.total_users),
		totalProjects: toInt(row?.total_projects),
		totalTasks: toInt(row?.total_tasks),
		totalRegistrosContables: toInt(row?.total_registros),
	};
}

export async function getContabilidadMetrics(): Promise<ContabilidadMetrics> {
	const { rows } = await pool.query<ContabilidadRow>(`
    SELECT 
      u.id as user_id,
      u.name,
      u.email,
      clr.updated_at as ultimo_update,
      CASE WHEN clr.user_id IS NOT NULL THEN true ELSE false END as tiene_registro,
      u.user_data->'billing'->>'ai_task_credits' as credits_raw
    FROM users u
    LEFT JOIN cont_ledger_records clr ON u.id = clr.user_id
    WHERE u.privileges != 'admin'
    ORDER BY clr.updated_at DESC NULLS LAST
  `);

	const usuariosActivos = rows.filter((row) => row.tiene_registro).length;

	const usuarios: UsuarioContabilidad[] = rows.map((row) => ({
		userId: row.user_id,
		nombre: row.name || "Sin nombre",
		email: row.email,
		tieneRegistro: row.tiene_registro,
		creditos: toInt(row.credits_raw),
		ultimoUpdate: row.ultimo_update || null,
	}));

	return {
		usuariosActivos,
		totalRegistros: usuariosActivos,
		usuarios,
	};
}

export async function getProyectosMetrics(): Promise<ProyectosMetrics> {
	const { rows } = await pool.query<ProyectosRow>(`
    SELECT 
      u.id as user_id,
      u.name,
      u.email,
      COUNT(DISTINCT p.id) as proyectos_count,
      COUNT(DISTINCT t.id) as tareas_count,
      u.user_data->'billing'->>'ai_task_credits' as credits_raw
    FROM users u
    LEFT JOIN projects p ON u.id = p.created_by
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE u.privileges != 'admin'
    GROUP BY u.id, u.name, u.email, u.user_data
    ORDER BY proyectos_count DESC, tareas_count DESC
  `);

	const usuarios: UsuarioProyectos[] = rows.map((row) => ({
		userId: row.user_id,
		nombre: row.name || "Sin nombre",
		email: row.email,
		proyectosCount: toInt(row.proyectos_count),
		tareasCount: toInt(row.tareas_count),
		creditos: toInt(row.credits_raw),
	}));

	return {
		usuarios,
	};
}

export async function getAdminAnalytics(
	period: AnalyticsPeriod = "month",
	anchorDate?: string,
): Promise<AdminAnalytics> {
	const { startDate, endDate } = getAnalyticsRange(period, anchorDate);
	const bucketKind = period === "year" ? "month" : "day";
	const bucketFormat = period === "year" ? "YYYY-MM" : "YYYY-MM-DD";
	const buckets = buildBuckets(period, startDate);

	const [
		registrationResult,
		loginResult,
		registrationSourcesResult,
		loginSourcesResult,
		summaryResult,
		usageResult,
		usersResult,
	] = await Promise.all([
		pool.query<BucketValueRow>(
			`
			SELECT to_char(date_trunc($2, created_at), $4) AS bucket_key, COUNT(*) AS total
			FROM users
			WHERE privileges != 'admin' AND created_at >= $1 AND created_at <= $3
			GROUP BY 1
			ORDER BY 1
			`,
			[startDate.toISOString(), bucketKind, endDate.toISOString(), bucketFormat],
		),
		pool.query<LoginBucketValueRow>(
			`
			SELECT to_char(date_trunc($2, ul.login_time), $4) AS bucket_key, COUNT(*) AS total, COUNT(DISTINCT ul.user_id) AS unique_users
			FROM users_logins ul
			INNER JOIN users u ON u.id = ul.user_id
			WHERE u.privileges != 'admin' AND ul.login_time >= $1 AND ul.login_time <= $3
			GROUP BY 1
			ORDER BY 1
			`,
			[startDate.toISOString(), bucketKind, endDate.toISOString(), bucketFormat],
		),
		pool.query<SourceCountRow>(
			`
			SELECT COALESCE(NULLIF(registration_source, ''), 'unknown') AS source, COUNT(*) AS total
			FROM users
			WHERE privileges != 'admin' AND created_at >= $1 AND created_at <= $2
			GROUP BY 1
			ORDER BY total DESC
			`,
			[startDate.toISOString(), endDate.toISOString()],
		),
		pool.query<SourceCountRow>(
			`
			SELECT COALESCE(NULLIF(ul.login_source, ''), 'unknown') AS source, COUNT(*) AS total
			FROM users_logins ul
			INNER JOIN users u ON u.id = ul.user_id
			WHERE u.privileges != 'admin' AND ul.login_time >= $1 AND ul.login_time <= $2
			GROUP BY 1
			ORDER BY total DESC
			`,
			[startDate.toISOString(), endDate.toISOString()],
		),
		pool.query<SummaryRow>(
			`
			SELECT
				(SELECT COUNT(*) FROM users WHERE privileges != 'admin') AS total_users,
				(SELECT COUNT(*) FROM users WHERE privileges != 'admin' AND created_at >= $1 AND created_at <= $2) AS new_users_in_period,
				(
					SELECT COUNT(DISTINCT ul.user_id)
					FROM users_logins ul
					INNER JOIN users u ON u.id = ul.user_id
					WHERE u.privileges != 'admin' AND ul.login_time >= $1 AND ul.login_time <= $2
				) AS users_logged_in_period
			`,
			[startDate.toISOString(), endDate.toISOString()],
		),
		pool.query<UsageSummaryRow>(
			`
			WITH usage_data AS (
				SELECT
					u.id,
					COUNT(DISTINCT p.id) AS projects_count,
					CASE WHEN clr.user_id IS NULL THEN false ELSE true END AS has_accounting
				FROM users u
				LEFT JOIN projects p ON p.created_by = u.id
				LEFT JOIN cont_ledger_records clr ON clr.user_id = u.id
				WHERE u.privileges != 'admin'
				GROUP BY u.id, clr.user_id
			)
			SELECT
				COUNT(*) FILTER (WHERE projects_count > 0) AS users_with_projects,
				COUNT(*) FILTER (WHERE has_accounting) AS users_with_accounting,
				COUNT(*) FILTER (WHERE projects_count > 0 AND has_accounting) AS users_with_both_modules,
				COUNT(*) FILTER (WHERE projects_count = 0 AND NOT has_accounting) AS users_without_modules
			FROM usage_data
			`,
		),
		pool.query<AnalyticsUserRow>(
			`
			SELECT
				u.id AS user_id,
				u.name,
				u.email,
				u.created_at,
				u.registration_source,
				MAX(ul.login_time) AS last_login_at,
				COUNT(ul.id) FILTER (WHERE ul.login_time >= $1 AND ul.login_time <= $2) AS logins_in_period,
				COUNT(DISTINCT p.id) AS projects_count,
				CASE WHEN clr.user_id IS NULL THEN false ELSE true END AS has_accounting
			FROM users u
			LEFT JOIN users_logins ul ON ul.user_id = u.id
			LEFT JOIN projects p ON p.created_by = u.id
			LEFT JOIN cont_ledger_records clr ON clr.user_id = u.id
			WHERE u.privileges != 'admin'
			GROUP BY u.id, u.name, u.email, u.created_at, u.registration_source, clr.user_id
			ORDER BY u.created_at DESC
			`,
			[startDate.toISOString(), endDate.toISOString()],
		),
	]);

	const registrationMap = new Map<string, number>(
		registrationResult.rows.map((row) => [row.bucket_key, toInt(row.total)]),
	);
	const loginMap = new Map<string, { total: number; uniqueUsers: number }>(
		loginResult.rows.map((row) => [
			row.bucket_key,
			{ total: toInt(row.total), uniqueUsers: toInt(row.unique_users) },
		]),
	);

	const registrationSeries: AnalyticsPoint[] = buckets.map((bucket) => ({
		key: bucket.key,
		label: bucket.label,
		value: registrationMap.get(bucket.key) ?? 0,
	}));

	const loginSeries: LoginAnalyticsPoint[] = buckets.map((bucket) => {
		const loginData = loginMap.get(bucket.key);
		return {
			key: bucket.key,
			label: bucket.label,
			value: loginData?.total ?? 0,
			uniqueUsers: loginData?.uniqueUsers ?? 0,
		};
	});

	const registrationSources: SourceCount[] = registrationSourcesResult.rows.map((row) => ({
		source: toSourceLabel(row.source),
		count: toInt(row.total),
	}));

	const loginSources: SourceCount[] = loginSourcesResult.rows.map((row) => ({
		source: toSourceLabel(row.source),
		count: toInt(row.total),
	}));

	const summaryRow = summaryResult.rows[0];
	const usageRow = usageResult.rows[0];

	const users: AdminAnalyticsUser[] = usersResult.rows.map((row) => ({
		userId: row.user_id,
		nombre: row.name || "Sin nombre",
		email: row.email,
		registeredAt: row.created_at,
		registrationSource: toSourceLabel(row.registration_source),
		lastLoginAt: row.last_login_at,
		loginsInPeriod: toInt(row.logins_in_period),
		projectsCount: toInt(row.projects_count),
		hasAccounting: row.has_accounting,
	}));

	return {
		period,
		generatedAt: new Date().toISOString(),
		startDate: startDate.toISOString(),
		endDate: endDate.toISOString(),
		summary: {
			totalUsers: toInt(summaryRow?.total_users),
			newUsersInPeriod: toInt(summaryRow?.new_users_in_period),
			usersLoggedInPeriod: toInt(summaryRow?.users_logged_in_period),
			usersWithProjects: toInt(usageRow?.users_with_projects),
			usersWithAccounting: toInt(usageRow?.users_with_accounting),
			usersWithBothModules: toInt(usageRow?.users_with_both_modules),
			usersWithoutModules: toInt(usageRow?.users_without_modules),
		},
		registrationSeries,
		loginSeries,
		registrationSources,
		loginSources,
		users,
	};
}

export async function getAllMetrics(): Promise<AdminMetrics> {
	const [general, contabilidad, proyectos] = await Promise.all([
		getGeneralMetrics(),
		getContabilidadMetrics(),
		getProyectosMetrics(),
	]);

	return {
		general,
		contabilidad,
		proyectos,
	};
}

export const isValidAnalyticsPeriod = (value: string): value is AnalyticsPeriod =>
	value === "week" || value === "month" || value === "year";

export async function getUserCreditsSnapshot(userId: string): Promise<number> {
	return getUserCredits(userId);
}
