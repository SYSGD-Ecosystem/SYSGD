import { pool } from "../db";

export type AnomalySeverity = "low" | "medium" | "high";

export interface MultiDeviceSignal {
	user_id: string;
	name: string | null;
	email: string;
	user_agents: number;
	ips: number;
	active_sessions: number;
	last_login: string | null;
	severity: AnomalySeverity;
}

export interface SharedAccountSignal {
	type: "shared_device" | "multi_identity";
	ip: string | null;
	user_agent: string | null;
	account_count: number;
	emails: string[];
	user_id: string | null;
	name: string | null;
	last_login: string | null;
	severity: AnomalySeverity;
}

export interface AnomalyReport {
	generatedAt: string;
	windows: { multiDeviceDays: number; sharedDays: number };
	multiDevice: MultiDeviceSignal[];
	sharedAccounts: SharedAccountSignal[];
}

const MULTI_DEVICE_DAYS = 90;
const SHARED_DAYS = 30;

const severityRank: Record<AnomalySeverity, number> = {
	low: 1,
	medium: 2,
	high: 3,
};

const bySeverityDesc = (
	a: { severity: AnomalySeverity },
	b: { severity: AnomalySeverity },
): number => severityRank[b.severity] - severityRank[a.severity];

const severityFromCounts = (
	userAgents: number,
	sessions: number,
	ips: number,
): AnomalySeverity => {
	if (userAgents >= 4 || sessions >= 3 || (ips >= 3 && userAgents >= 3)) {
		return "high";
	}
	if (userAgents >= 3 || sessions >= 2) return "medium";
	return "low";
};

/**
 * Señales de riesgo de autenticación:
 * - multiDevice: una misma cuenta con >=2 user-agents distintos (o >=2 sesiones
 *   activas) en la ventana.
 * - sharedAccounts: mismo IP+user-agent usado por >=2 cuentas (dispositivo
 *   compartido) y cuentas con >=3 user-agents (varias personas en una cuenta).
 */
export async function getAnomalySignals(): Promise<AnomalyReport> {
	const sessionsTable = await pool.query<{ t: string | null }>(
		"SELECT to_regclass('public.user_sessions') AS t",
	);
	const hasSessions = Boolean(sessionsTable.rows[0]?.t);

	const [loginsResult, sessionsResult, sharedDeviceResult, multiIdentityResult] =
		await Promise.all([
			pool.query<{
				id: string;
				name: string | null;
				email: string;
				user_agents: string;
				ips: string;
				last_login: string;
			}>(
				`SELECT u.id, u.name, u.email,
					COUNT(DISTINCT ul.user_agent) AS user_agents,
					COUNT(DISTINCT ul.ip_address) AS ips,
					MAX(ul.login_time) AS last_login
				FROM users_logins ul
				JOIN users u ON u.id = ul.user_id
				WHERE ul.login_time > NOW() - INTERVAL '${MULTI_DEVICE_DAYS} days'
				GROUP BY u.id, u.name, u.email
				HAVING COUNT(DISTINCT ul.user_agent) >= 2
				ORDER BY user_agents DESC, ips DESC
				LIMIT 50`,
			),
			hasSessions
				? pool.query<{
						id: string;
						name: string | null;
						email: string;
						active_sessions: string;
					}>(
						`SELECT u.id, u.name, u.email, COUNT(*) AS active_sessions
						 FROM user_sessions s
						 JOIN users u ON u.id = s.user_id
						 WHERE s.revoked_at IS NULL
							AND (s.expires_at IS NULL OR s.expires_at > NOW())
						 GROUP BY u.id, u.name, u.email
						 HAVING COUNT(*) >= 2`,
					)
				: Promise.resolve({
						rows: [] as {
							id: string;
							name: string | null;
							email: string;
							active_sessions: string;
						}[],
					}),
			pool.query<{
				ip_address: string;
				user_agent: string;
				account_count: string;
				emails: string[];
				last_login: string;
			}>(
				`SELECT ul.ip_address, ul.user_agent,
					COUNT(DISTINCT ul.user_id) AS account_count,
					ARRAY_AGG(DISTINCT u.email ORDER BY u.email) AS emails,
					MAX(ul.login_time) AS last_login
				FROM users_logins ul
				JOIN users u ON u.id = ul.user_id
				WHERE ul.login_time > NOW() - INTERVAL '${SHARED_DAYS} days'
					AND ul.ip_address IS NOT NULL AND ul.ip_address <> ''
					AND ul.user_agent IS NOT NULL AND ul.user_agent <> ''
				GROUP BY ul.ip_address, ul.user_agent
				HAVING COUNT(DISTINCT ul.user_id) >= 2
				ORDER BY account_count DESC, last_login DESC
				LIMIT 50`,
			),
			pool.query<{
				id: string;
				name: string | null;
				email: string;
				user_agents: string;
				ips: string;
				last_login: string;
			}>(
				`SELECT u.id, u.name, u.email,
					COUNT(DISTINCT ul.user_agent) AS user_agents,
					COUNT(DISTINCT ul.ip_address) AS ips,
					MAX(ul.login_time) AS last_login
				FROM users_logins ul
				JOIN users u ON u.id = ul.user_id
				WHERE ul.login_time > NOW() - INTERVAL '${SHARED_DAYS} days'
				GROUP BY u.id, u.name, u.email
				HAVING COUNT(DISTINCT ul.user_agent) >= 3
				ORDER BY user_agents DESC
				LIMIT 50`,
			),
		]);

	const activeSessions = new Map<string, number>();
	for (const row of sessionsResult.rows) {
		activeSessions.set(row.id, Number(row.active_sessions));
	}

	const multiDevice: MultiDeviceSignal[] = loginsResult.rows.map((row) => {
		const sessions = activeSessions.get(row.id) ?? 0;
		const userAgents = Number(row.user_agents);
		const ips = Number(row.ips);
		return {
			user_id: row.id,
			name: row.name,
			email: row.email,
			user_agents: userAgents,
			ips,
			active_sessions: sessions,
			last_login: row.last_login,
			severity: severityFromCounts(userAgents, sessions, ips),
		};
	});

	// Usuarios con >=2 sesiones activas pero sin suficientes logins distintos
	// en la ventana: también cuentan como multi-dispositivo.
	const known = new Set(multiDevice.map((s) => s.user_id));
	for (const row of sessionsResult.rows) {
		if (known.has(row.id)) continue;
		const sessions = Number(row.active_sessions);
		multiDevice.push({
			user_id: row.id,
			name: row.name,
			email: row.email,
			user_agents: 0,
			ips: 0,
			active_sessions: sessions,
			last_login: null,
			severity: severityFromCounts(0, sessions, 0),
		});
	}
	multiDevice.sort(bySeverityDesc);

	const sharedAccounts: SharedAccountSignal[] = [
		...sharedDeviceResult.rows.map((row) => ({
			type: "shared_device" as const,
			ip: row.ip_address,
			user_agent: row.user_agent,
			account_count: Number(row.account_count),
			emails: row.emails,
			user_id: null,
			name: null,
			last_login: row.last_login,
			severity:
				Number(row.account_count) >= 3
					? ("high" as AnomalySeverity)
					: ("medium" as AnomalySeverity),
		})),
		...multiIdentityResult.rows.map((row) => ({
			type: "multi_identity" as const,
			ip: null,
			user_agent: null,
			account_count: 1,
			emails: [row.email],
			user_id: row.id,
			name: row.name,
			last_login: row.last_login,
			severity: (Number(row.user_agents) >= 4
				? "high"
				: "medium") as AnomalySeverity,
		})),
	].sort(bySeverityDesc);

	return {
		generatedAt: new Date().toISOString(),
		windows: { multiDeviceDays: MULTI_DEVICE_DAYS, sharedDays: SHARED_DAYS },
		multiDevice,
		sharedAccounts,
	};
}
