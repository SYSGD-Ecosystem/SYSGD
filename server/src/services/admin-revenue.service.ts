import { pool } from "../db";

export interface RevenueMonth {
	/** Formato YYYY-MM */
	month: string;
	revenue: number;
	orders: number;
	buyers: number;
}

export interface MonthlyRevenue {
	months: number;
	series: RevenueMonth[];
	kpis: {
		currentMonth: number;
		previousMonth: number;
		total: number;
		orders: number;
		avgTicket: number;
	};
}

const monthKey = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const clampMonths = (value: unknown, fallback: number): number => {
	const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(Math.max(parsed, 3), 36);
};

/**
 * Ingresos mensuales desde pagos manuales aprobados (Transfermóvil).
 * Rellena con 0 los meses sin ventas para que el gráfico sea continuo.
 */
export async function getMonthlyRevenue(input?: {
	months?: unknown;
}): Promise<MonthlyRevenue> {
	const months = clampMonths(input?.months, 12);

	const result = await pool.query<{
		month: string;
		revenue: string;
		orders: string;
		buyers: string;
	}>(
		`SELECT
			to_char(date_trunc('month', COALESCE(reviewed_at, created_at)), 'YYYY-MM') AS month,
			SUM(COALESCE(sms_amount_cup, expected_amount_cup))::numeric(14,2) AS revenue,
			COUNT(*) AS orders,
			COUNT(DISTINCT user_id) AS buyers
		FROM manual_payment_orders
		WHERE status = 'approved'
			AND COALESCE(reviewed_at, created_at) >= date_trunc('month', NOW()) - make_interval(months => $1)
		GROUP BY 1
		ORDER BY 1`,
		[months],
	);

	const byMonth = new Map<string, RevenueMonth>();
	for (const row of result.rows) {
		byMonth.set(row.month, {
			month: row.month,
			revenue: Number(row.revenue),
			orders: Number(row.orders),
			buyers: Number(row.buyers),
		});
	}

	const now = new Date();
	const series: RevenueMonth[] = [];
	for (let i = months - 1; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = monthKey(d);
		series.push(
			byMonth.get(key) ?? { month: key, revenue: 0, orders: 0, buyers: 0 },
		);
	}

	const total = series.reduce((sum, m) => sum + m.revenue, 0);
	const orders = series.reduce((sum, m) => sum + m.orders, 0);
	const currentMonth = series[series.length - 1]?.revenue ?? 0;
	const previousMonth = series[series.length - 2]?.revenue ?? 0;

	return {
		months,
		series,
		kpis: {
			currentMonth,
			previousMonth,
			total,
			orders,
			avgTicket: orders > 0 ? total / orders : 0,
		},
	};
}
