import { useMemo, useState } from "react";
import {
	Activity,
	BarChart3,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Filter,
	PieChart,
	Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type AdminAnalyticsUser,
	type AnalyticsPoint,
	type AnalyticsPeriod,
	useAdminAnalytics,
} from "@/hooks/connection/useAdminAnalytics";

type ModuleFilter = "all" | "projects" | "accounting" | "both" | "inactive";

function MiniBarChart({
	data,
	colorClass,
	emptyLabel,
}: {
	data: AnalyticsPoint[];
	colorClass: string;
	emptyLabel: string;
}) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const maxValue = Math.max(...data.map((item) => item.value), 1);
	const hasValues = data.some((item) => item.value > 0);

	if (data.length === 0) {
		return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
	}

	if (!hasValues) {
		return (
			<div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
				Sin valores en este rango
			</div>
		);
	}

	const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;
	const tooltipLeft =
		hoveredIndex === null || data.length <= 1
			? 50
			: (hoveredIndex / (data.length - 1)) * 100;

	return (
		<div>
			<div className="relative h-44 flex items-stretch gap-1.5">
				{hoveredItem && (
					<div
						className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 -translate-y-1 rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg"
						style={{ left: `${tooltipLeft}%` }}
					>
						<div className="font-medium">{hoveredItem.label}</div>
						<div>{hoveredItem.value}</div>
					</div>
				)}
				{data.map((item, index) => (
					<div
						key={item.key}
						className="h-full flex-1 min-w-0 flex flex-col items-center justify-end gap-2"
						onMouseEnter={() => setHoveredIndex(index)}
						onMouseLeave={() => setHoveredIndex(null)}
					>
						<div
							className={`w-full min-h-1 rounded-t-sm ${colorClass}`}
							style={{ height: `${Math.max((item.value / maxValue) * 100, 4)}%` }}
							aria-label={`${item.label}: ${item.value}`}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

function SourceBars({
	title,
	data,
}: {
	title: string;
	data: Array<{ source: string; count: number }>;
}) {
	const maxValue = Math.max(...data.map((item) => item.count), 1);
	return (
		<Card className="border-border">
			<CardHeader className="pb-2">
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{data.map((item) => (
					<div key={`${title}-${item.source}`} className="space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">{item.source}</span>
							<span className="font-medium">{item.count}</span>
						</div>
						<div className="h-2 rounded bg-muted">
							<div
								className="h-2 rounded bg-primary"
								style={{ width: `${(item.count / maxValue) * 100}%` }}
							/>
						</div>
					</div>
				))}
				{data.length === 0 && (
					<p className="text-sm text-muted-foreground">No hay datos en este periodo.</p>
				)}
			</CardContent>
		</Card>
	);
}

const matchesModuleFilter = (user: AdminAnalyticsUser, filter: ModuleFilter): boolean => {
	switch (filter) {
		case "projects":
			return user.projectsCount > 0;
		case "accounting":
			return user.hasAccounting;
		case "both":
			return user.projectsCount > 0 && user.hasAccounting;
		case "inactive":
			return user.projectsCount === 0 && !user.hasAccounting;
		default:
			return true;
	}
};

const formatDateTime = (value: string | null): string =>
	value ? new Date(value).toLocaleString("es-ES") : "Sin actividad";

export default function AdminAnalyticsPage() {
	const { analytics, loading, error, period, setPeriod, anchorDate, setAnchorDate } =
		useAdminAnalytics("month");
	const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");

	const filteredUsers = useMemo(
		() =>
			(analytics?.users || []).filter((user) => matchesModuleFilter(user, moduleFilter)),
		[analytics?.users, moduleFilter],
	);

	const loginSeriesForChart = useMemo(
		() =>
			(analytics?.loginSeries || []).map((item) => ({
				key: item.key,
				label: item.label,
				value: item.uniqueUsers,
			})),
		[analytics?.loginSeries],
	);

	const periodLabel: Record<AnalyticsPeriod, string> = {
		week: "Últimos 7 días",
		month: "Últimos 30 días",
		year: "Últimos 12 meses",
	};

	const formatDateShort = (value: string) =>
		new Date(value).toLocaleDateString("es-ES", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});

	const shiftAnchor = (direction: "prev" | "next") => {
		const delta = direction === "prev" ? -1 : 1;
		const next = new Date(anchorDate);
		if (period === "week") {
			next.setDate(next.getDate() + 7 * delta);
		} else if (period === "month") {
			next.setDate(next.getDate() + 30 * delta);
		} else {
			next.setMonth(next.getMonth() + delta);
		}
		setAnchorDate(next);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Analítica</h1>
					<p className="text-muted-foreground">
						Estadísticas de registros, uso de módulos y actividad de inicio de sesión.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => shiftAnchor("prev")}
							className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => shiftAnchor("next")}
							className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
					<div className="min-w-[180px]">
						<Select value={period} onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Periodo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="week">Semana</SelectItem>
								<SelectItem value="month">Mes</SelectItem>
								<SelectItem value="year">Año</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="min-w-[220px]">
						<Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as ModuleFilter)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Filtro de módulo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los usuarios</SelectItem>
								<SelectItem value="projects">Con proyectos</SelectItem>
								<SelectItem value="accounting">Con contabilidad</SelectItem>
								<SelectItem value="both">Con ambos módulos</SelectItem>
								<SelectItem value="inactive">Sin uso de módulos</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{loading && <p className="text-sm text-muted-foreground">Cargando analíticas...</p>}
			{error && <p className="text-sm text-destructive">{error}</p>}

			{analytics && (
				<>
					<p className="text-xs text-muted-foreground">
						Rango activo: {formatDateShort(analytics.startDate)} - {formatDateShort(analytics.endDate)}
					</p>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card className="border-border">
							<CardHeader className="pb-2 flex flex-row items-center justify-between">
								<CardTitle className="text-sm text-muted-foreground">Nuevos Registros</CardTitle>
								<Users className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">{analytics.summary.newUsersInPeriod}</p>
								<p className="text-xs text-muted-foreground">{periodLabel[analytics.period]}</p>
							</CardContent>
						</Card>
						<Card className="border-border">
							<CardHeader className="pb-2 flex flex-row items-center justify-between">
								<CardTitle className="text-sm text-muted-foreground">Usuarios que Iniciaron Sesión</CardTitle>
								<Activity className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">{analytics.summary.usersLoggedInPeriod}</p>
								<p className="text-xs text-muted-foreground">Con actividad en el periodo</p>
							</CardContent>
						</Card>
						<Card className="border-border">
							<CardHeader className="pb-2 flex flex-row items-center justify-between">
								<CardTitle className="text-sm text-muted-foreground">Uso Proyectos</CardTitle>
								<BarChart3 className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">{analytics.summary.usersWithProjects}</p>
								<p className="text-xs text-muted-foreground">Usuarios con al menos 1 proyecto</p>
							</CardContent>
						</Card>
						<Card className="border-border">
							<CardHeader className="pb-2 flex flex-row items-center justify-between">
								<CardTitle className="text-sm text-muted-foreground">Uso Contabilidad</CardTitle>
								<PieChart className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">{analytics.summary.usersWithAccounting}</p>
								<p className="text-xs text-muted-foreground">Usuarios con registro contable</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 lg:grid-cols-2">
						<Card className="border-border">
							<CardHeader className="pb-2">
								<CardTitle className="text-base">Registros por periodo</CardTitle>
							</CardHeader>
							<CardContent>
								<MiniBarChart
									data={analytics.registrationSeries}
									colorClass="bg-blue-500/80"
									emptyLabel="Sin datos de registro"
								/>
							</CardContent>
						</Card>
						<Card className="border-border">
							<CardHeader className="pb-2">
								<CardTitle className="text-base">Usuarios que iniciaron sesión</CardTitle>
							</CardHeader>
							<CardContent>
								<MiniBarChart
									data={loginSeriesForChart}
									colorClass="bg-emerald-500/80"
									emptyLabel="Sin inicios de sesión"
								/>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 lg:grid-cols-2">
						<SourceBars title="Origen de registro de cuentas" data={analytics.registrationSources} />
						<SourceBars title="Origen de inicio de sesión" data={analytics.loginSources} />
					</div>

					<Card className="border-border">
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<div>
								<CardTitle className="text-base">Usuarios y uso de módulos</CardTitle>
								<p className="text-sm text-muted-foreground">
									Filtro aplicado: <strong>{moduleFilter}</strong> · {filteredUsers.length} resultados
								</p>
							</div>
							<Badge variant="outline" className="w-fit">
								<CalendarDays className="mr-1 h-3.5 w-3.5" />
								Actualizado: {formatDateTime(analytics.generatedAt)}
							</Badge>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th className="text-left py-2 px-2">Usuario</th>
											<th className="text-left py-2 px-2">Origen Registro</th>
											<th className="text-center py-2 px-2">Proyectos</th>
											<th className="text-center py-2 px-2">Contabilidad</th>
											<th className="text-center py-2 px-2">Logins periodo</th>
											<th className="text-left py-2 px-2">Último login</th>
										</tr>
									</thead>
									<tbody>
										{filteredUsers.map((user) => (
											<tr key={user.userId} className="border-b last:border-0">
												<td className="py-2 px-2">
													<div className="font-medium">{user.nombre}</div>
													<div className="text-xs text-muted-foreground">{user.email}</div>
												</td>
												<td className="py-2 px-2">{user.registrationSource}</td>
												<td className="text-center py-2 px-2">{user.projectsCount}</td>
												<td className="text-center py-2 px-2">
													{user.hasAccounting ? "Sí" : "No"}
												</td>
												<td className="text-center py-2 px-2">{user.loginsInPeriod}</td>
												<td className="py-2 px-2">{formatDateTime(user.lastLoginAt)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{filteredUsers.length === 0 && (
								<div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
									<Filter className="w-4 h-4" />
									No hay usuarios para el filtro seleccionado.
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
