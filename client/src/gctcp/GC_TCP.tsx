import { type FC, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
	Archive,
	BarChart3,
	Blocks,
	BookOpen,
	Boxes,
	BriefcaseBusiness,
	CalendarDays,
	CircleHelp,
	CreditCard,
	DatabaseBackup,
	FileText,
	Info,
	Landmark,
	LayoutDashboard,
	List,
	Menu,
	PackageSearch,
	RefreshCw,
	Search,
	Shield,
	ShoppingCart,
	TrendingDown,
	TrendingUp,
	Users,
	WalletCards,
	X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
	CloudLedgerContainer,
	CloudWorkspaceEntry,
	ContLedgerResponse,
	DayAmountRow,
	GeneralesData,
	MonthCode,
	MonthlyTotals,
	RegistroTCP,
	TributoRow,
} from "../accounting/core/types/accountingTypes";
import { MONTH_CODES, MONTH_NAMES } from "../accounting/core/utils/constants";
import UploadBackupPanel from "./UploadBackupPanel";

type GcTcpView =
	| "dashboard"
	| "generales"
	| "ingresos"
	| "gastos"
	| "tributos"
	| "resumen"
	| "ventas"
	| "nomencladores"
	| "terceros"
	| "documentos"
	| "catalogos"
	| "seguridad"
	| "licencias"
	| "respaldo"
	| "acerca"
	| "ayuda"
	| "recursos";

type LedgerApiResponse = Omit<ContLedgerResponse, "registro" | "updatedAt"> & {
	registro: CloudLedgerContainer | null;
	updatedAt: string | null;
};

type NavigationSection = {
	title: string;
	items: NavigationItem[];
};

type NavigationItem = {
	id: GcTcpView;
	label: string;
	icon: ReactNode;
};

type MetricCardProps = {
	title: string;
	value: string;
	detail: string;
	icon: ReactNode;
	accent: string;
};

type WorkspaceAnalysis = {
	workspace: CloudWorkspaceEntry;
	totalIngresos: number;
	totalGastos: number;
	totalTributos: number;
	totalOtrosDeducibles: number;
	baseImponible: number;
	impuestoEstimado: number;
	monthly: MonthlyTotals[];
	incomeRows: number;
	expenseRows: number;
	tributoRows: number;
	productCount: number;
	stockCount: number;
	thirdPartyCount: number;
	accountCount: number;
	lastMonthWithActivity: string;
	completenessScore: number;
};

const EMPTY_GENERALES: GeneralesData = {
	nombre: "",
	anio: new Date().getFullYear(),
	nit: "",
	actividad: "",
	codigo: "",
	fiscalCalle: "",
	fiscalMunicipio: "",
	fiscalProvincia: "",
	legalCalle: "",
	legalMunicipio: "",
	legalProvincia: "",
};

const TRIBUTO_FIELDS: Array<keyof Omit<TributoRow, "mes">> = [
	"ventas",
	"fuerza",
	"sellos",
	"anuncios",
	"css20",
	"css14",
	"otros",
	"restauracion",
	"arrendamiento",
	"exonerado",
	"otrosMFP",
	"cuotaMensual",
];

const TRIBUTO_DEDUCIBLE_FIELDS: Array<keyof Omit<TributoRow, "mes">> = [
	"ventas",
	"fuerza",
	"sellos",
	"anuncios",
	"css20",
	"css14",
	"otros",
	"cuotaMensual",
];

const OTHER_DEDUCTIBLE_FIELDS: Array<keyof Omit<TributoRow, "mes">> = [
	"restauracion",
	"arrendamiento",
	"exonerado",
	"otrosMFP",
];

const navigationSections: NavigationSection[] = [
	{
		title: "Inicio",
		items: [{ id: "dashboard", label: "Dashboard", icon: <BarChart3 /> }],
	},
	{
		title: "Registro Contable DJ",
		items: [
			{ id: "generales", label: "General", icon: <BookOpen /> },
			{ id: "ingresos", label: "Ingresos", icon: <TrendingUp /> },
			{ id: "gastos", label: "Gastos", icon: <TrendingDown /> },
			{ id: "tributos", label: "Tributos", icon: <Landmark /> },
			{ id: "resumen", label: "Resumen", icon: <LayoutDashboard /> },
		],
	},
	{
		title: "Herramientas",
		items: [
			{ id: "ventas", label: "Punto de Venta", icon: <ShoppingCart /> },
			{ id: "nomencladores", label: "Nomencladores", icon: <List /> },
			{ id: "terceros", label: "Terceros", icon: <Users /> },
			{ id: "documentos", label: "Documentos", icon: <FileText /> },
		],
	},
	{
		title: "Catalogo",
		items: [{ id: "catalogos", label: "Cuentas y Productos", icon: <Blocks /> }],
	},
	{
		title: "Cuenta y plataforma",
		items: [
			{ id: "seguridad", label: "Seguridad y cuenta", icon: <Shield /> },
			{ id: "licencias", label: "Licencias y creditos", icon: <CreditCard /> },
			{ id: "respaldo", label: "Respaldo y acceso", icon: <DatabaseBackup /> },
			{ id: "acerca", label: "Acerca de", icon: <Info /> },
		],
	},
	{
		title: "Guias y apoyo",
		items: [
			{ id: "ayuda", label: "Ayuda de llenado", icon: <CircleHelp /> },
			{ id: "recursos", label: "Recursos utiles", icon: <Search /> },
		],
	},
];

const parseAmount = (value: string | number | null | undefined): number => {
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	if (!value) return 0;
	const normalized = value.replace(/\s/g, "").replace(",", ".");
	const parsed = Number.parseFloat(normalized);
	return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: number): string =>
	new Intl.NumberFormat("es-CU", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);

const formatDate = (value: string | null): string => {
	if (!value) return "Sin sincronizacion";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Fecha no disponible";
	return new Intl.DateTimeFormat("es-CU", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
};

const getRows = (registro: RegistroTCP, key: "ingresos" | "gastos", month: MonthCode): DayAmountRow[] =>
	registro[key][month] ?? [];

const monthTotal = (rows: DayAmountRow[]): number =>
	rows.reduce((total, row) => total + parseAmount(row.importe), 0);

const activeRows = (rows: DayAmountRow[]): DayAmountRow[] =>
	rows.filter((row) => row.dia.trim() !== "" || row.importe.trim() !== "");

const tributoTotal = (
	row: TributoRow | undefined,
	fields: Array<keyof Omit<TributoRow, "mes">> = TRIBUTO_FIELDS,
): number => {
	if (!row) return 0;
	return fields.reduce((total, field) => total + parseAmount(row[field]), 0);
};

const getTributoRow = (registro: RegistroTCP, monthIndex: number): TributoRow | undefined => {
	const monthName = MONTH_NAMES[monthIndex];
	const monthCode = MONTH_CODES[monthIndex];
	return registro.tributos.find((row) => row.mes === monthName || row.mes === monthCode);
};

const calculateWorkspaceAnalysis = (workspace: CloudWorkspaceEntry): WorkspaceAnalysis => {
	const monthly = MONTH_CODES.map((month, index) => {
		const tributoRow = getTributoRow(workspace.registro, index);
		const ingresos = monthTotal(getRows(workspace.registro, "ingresos", month));
		const gastos = monthTotal(getRows(workspace.registro, "gastos", month));
		const tributos = tributoTotal(tributoRow, TRIBUTO_DEDUCIBLE_FIELDS);
		const otrosDeducibles = tributoTotal(tributoRow, OTHER_DEDUCTIBLE_FIELDS);

		return {
			month,
			ingresos,
			gastos,
			tributos,
			otrosDeducibles,
			neto: ingresos - gastos - tributos - otrosDeducibles,
		};
	});

	const totalIngresos = monthly.reduce((total, month) => total + month.ingresos, 0);
	const totalGastos = monthly.reduce((total, month) => total + month.gastos, 0);
	const totalTributos = monthly.reduce((total, month) => total + month.tributos, 0);
	const totalOtrosDeducibles = monthly.reduce((total, month) => total + month.otrosDeducibles, 0);
	const incomeRows = MONTH_CODES.reduce(
		(total, month) => total + activeRows(getRows(workspace.registro, "ingresos", month)).length,
		0,
	);
	const expenseRows = MONTH_CODES.reduce(
		(total, month) => total + activeRows(getRows(workspace.registro, "gastos", month)).length,
		0,
	);
	const tribtutoRows = workspace.registro.tributos.filter((row) => tributoTotal(row) > 0).length;
	const lastActiveMonth = [...monthly].reverse().find((month) => month.ingresos > 0 || month.gastos > 0 || month.tributos > 0);
	const completenessFields = [
		workspace.registro.generales.nombre,
		workspace.registro.generales.nit,
		workspace.registro.generales.actividad,
		workspace.registro.generales.codigo,
		workspace.registro.generales.fiscalProvincia,
		workspace.registro.generales.legalProvincia,
	];
	const completedFields = completenessFields.filter((value) => value.trim() !== "").length;

	return {
		workspace,
		totalIngresos,
		totalGastos,
		totalTributos,
		totalOtrosDeducibles,
		baseImponible: totalIngresos - totalGastos - totalTributos - totalOtrosDeducibles,
		impuestoEstimado: Math.max(0, (totalIngresos - totalGastos - totalTributos - totalOtrosDeducibles) * 0.15),
		monthly,
		incomeRows,
		expenseRows,
		tributoRows: tribtutoRows,
		productCount: workspace.registro.inventario.productos.length,
		stockCount: workspace.registro.inventario.stock.length,
		thirdPartyCount: workspace.registro.terceros.terceros.length,
		accountCount: workspace.accounting.cuentasContables.length,
		lastMonthWithActivity: lastActiveMonth?.month ?? "Sin actividad",
		completenessScore: Math.round((completedFields / completenessFields.length) * 100),
	};
};

const getViewTitle = (view: GcTcpView): string => {
	for (const section of navigationSections) {
		const item = section.items.find((entry) => entry.id === view);
		if (item) return item.label;
	}
	return "Gestor Contable TCP";
};

const MetricCard: FC<MetricCardProps> = ({ title, value, detail, icon, accent }) => (
	<Card className="rounded-lg shadow-sm">
		<CardContent className="p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
					<p className="mt-2 break-words text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
					<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
				</div>
				<div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md [&_svg]:size-5", accent)}>
					{icon}
				</div>
			</div>
		</CardContent>
	</Card>
);

const EmptyState: FC<{ title: string; description: string; icon: ReactNode }> = ({ title, description, icon }) => (
	<div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
		<div className="mb-3 flex size-11 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 [&_svg]:size-5">
			{icon}
		</div>
		<h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
		<p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
	</div>
);

const SidebarButton: FC<{
	item: NavigationItem;
	selected: boolean;
	onSelect: (view: GcTcpView) => void;
}> = ({ item, selected, onSelect }) => (
	<button
		type="button"
		onClick={() => onSelect(item.id)}
		className={cn(
			"flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors [&_svg]:size-4",
			selected
				? "bg-emerald-100 font-medium text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100"
				: "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50",
		)}
	>
		<span className="shrink-0">{item.icon}</span>
		<span className="min-w-0 break-words">{item.label}</span>
	</button>
);

const GcTcpSidebar: FC<{
	view: GcTcpView;
	onSelect: (view: GcTcpView) => void;
	onClose?: () => void;
}> = ({ view, onSelect, onClose }) => {
	const handleSelect = (nextView: GcTcpView) => {
		onSelect(nextView);
		onClose?.();
	};

	return (
		<aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
						<WalletCards className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">Gestor Contable TCP</p>
						<p className="truncate text-xs text-slate-500 dark:text-slate-400">Version escritorio</p>
					</div>
				</div>
				{onClose && (
					<Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar menu">
						<X />
					</Button>
				)}
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				{navigationSections.map((section) => (
					<div key={section.title} className="mb-4">
						<p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
							{section.title}
						</p>
						<div className="space-y-1">
							{section.items.map((item) => (
								<SidebarButton key={item.id} item={item} selected={item.id === view} onSelect={handleSelect} />
							))}
						</div>
					</div>
				))}
			</div>
		</aside>
	);
};

const WorkspaceSelector: FC<{
	analyses: WorkspaceAnalysis[];
	activeWorkspaceId: string;
	onSelect: (workspaceId: string) => void;
	savingWorkspace: boolean;
}> = ({ analyses, activeWorkspaceId, onSelect, savingWorkspace }) => (
	<div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
		{analyses.map((analysis) => {
			const selected = analysis.workspace.id === activeWorkspaceId;
			return (
				<button
					key={analysis.workspace.id}
					type="button"
					onClick={() => onSelect(analysis.workspace.id)}
					className={cn(
						"rounded-lg border bg-white p-4 text-left transition-colors dark:bg-slate-900",
						selected
							? "border-emerald-500 ring-2 ring-emerald-500/20"
							: "border-slate-200 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-700",
					)}
					disabled={savingWorkspace}
				>
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate font-semibold text-slate-950 dark:text-slate-50">{analysis.workspace.name}</p>
							<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
								{analysis.workspace.registro.generales.nombre || "Sin nombre fiscal"}
							</p>
						</div>
						{selected && <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Activo</Badge>}
					</div>
					<div className="mt-4 grid grid-cols-3 gap-2 text-xs">
						<div>
							<p className="text-slate-500 dark:text-slate-400">Neto</p>
							<p className="font-semibold text-slate-950 dark:text-slate-50">{formatMoney(analysis.baseImponible)}</p>
						</div>
						<div>
							<p className="text-slate-500 dark:text-slate-400">Asientos</p>
							<p className="font-semibold text-slate-950 dark:text-slate-50">{analysis.incomeRows + analysis.expenseRows}</p>
						</div>
						<div>
							<p className="text-slate-500 dark:text-slate-400">Ficha</p>
							<p className="font-semibold text-slate-950 dark:text-slate-50">{analysis.completenessScore}%</p>
						</div>
					</div>
				</button>
			);
		})}
	</div>
);

const MonthlyChart: FC<{ analysis: WorkspaceAnalysis }> = ({ analysis }) => {
	const maxValue = Math.max(
		1,
		...analysis.monthly.flatMap((month) => [month.ingresos, month.gastos, Math.abs(month.neto)]),
	);

	return (
		<Card className="rounded-lg shadow-sm">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">Comportamiento mensual</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="space-y-3">
					{analysis.monthly.map((month) => (
						<div key={month.month} className="grid grid-cols-[3rem_1fr_5.5rem] items-center gap-3 text-sm">
							<span className="font-medium text-slate-600 dark:text-slate-300">{month.month}</span>
							<div className="space-y-1">
								<div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
									<div
										className="h-2 rounded-full bg-emerald-500"
										style={{ width: `${Math.max(2, (month.ingresos / maxValue) * 100)}%` }}
									/>
								</div>
								<div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
									<div
										className="h-2 rounded-full bg-rose-500"
										style={{ width: `${Math.max(2, (month.gastos / maxValue) * 100)}%` }}
									/>
								</div>
							</div>
							<span className="text-right text-xs text-slate-500 dark:text-slate-400">{formatMoney(month.neto)}</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

const GeneralView: FC<{ workspace: CloudWorkspaceEntry; analysis: WorkspaceAnalysis }> = ({ workspace, analysis }) => {
	const generales = workspace.registro.generales ?? EMPTY_GENERALES;
	const fiscalAddress = [generales.fiscalCalle, generales.fiscalMunicipio, generales.fiscalProvincia].filter(Boolean).join(", ");
	const legalAddress = [generales.legalCalle, generales.legalMunicipio, generales.legalProvincia].filter(Boolean).join(", ");
	const fields = [
		["Nombre", generales.nombre],
		["Año", String(generales.anio || "")],
		["NIT", generales.nit],
		["Actividad", generales.actividad],
		["Codigo", generales.codigo],
		["Direccion fiscal", fiscalAddress],
		["Direccion legal", legalAddress],
	];

	return (
		<div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Datos generales</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2">
					{fields.map(([label, value]) => (
						<div key={label} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
							<p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</p>
							<p className="mt-1 break-words text-sm font-semibold text-slate-950 dark:text-slate-50">{value || "-"}</p>
						</div>
					))}
				</CardContent>
			</Card>
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Lectura del espacio</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 p-4 pt-0">
					<MetricCard
						title="Completitud fiscal"
						value={`${analysis.completenessScore}%`}
						detail="Campos base completados"
						icon={<BriefcaseBusiness />}
						accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
					/>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
							<p className="text-slate-500 dark:text-slate-400">Ultimo mes activo</p>
							<p className="font-semibold text-slate-950 dark:text-slate-50">{analysis.lastMonthWithActivity}</p>
						</div>
						<div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
							<p className="text-slate-500 dark:text-slate-400">Cuentas</p>
							<p className="font-semibold text-slate-950 dark:text-slate-50">{analysis.accountCount}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

const EntriesView: FC<{ workspace: CloudWorkspaceEntry; type: "ingresos" | "gastos" }> = ({ workspace, type }) => {
	const label = type === "ingresos" ? "Ingresos" : "Gastos";
	const tone = type === "ingresos" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300";

	return (
		<Card className="rounded-lg shadow-sm">
			<CardHeader className="flex-row items-center justify-between gap-3 p-4">
				<CardTitle className="text-base">{label} por mes</CardTitle>
				<Badge variant="outline">{workspace.name}</Badge>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[760px] text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
								<th className="py-3 pr-4">Mes</th>
								<th className="py-3 pr-4 text-right">Total</th>
								<th className="py-3 pr-4 text-right">Asientos</th>
								<th className="py-3 pr-4">Ultimos movimientos</th>
							</tr>
						</thead>
						<tbody>
							{MONTH_CODES.map((month) => {
								const rows = activeRows(getRows(workspace.registro, type, month));
								return (
									<tr key={month} className="border-b border-slate-100 dark:border-slate-800/80">
										<td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">{month}</td>
										<td className={cn("py-3 pr-4 text-right font-semibold", tone)}>{formatMoney(monthTotal(rows))}</td>
										<td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">{rows.length}</td>
										<td className="py-3 pr-4 text-slate-500 dark:text-slate-400">
											{rows.slice(-3).map((row) => `Dia ${row.dia}: ${formatMoney(parseAmount(row.importe))}`).join(" | ") || "-"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
};

const TributosView: FC<{ workspace: CloudWorkspaceEntry; analysis: WorkspaceAnalysis }> = ({ workspace, analysis }) => (
	<div className="space-y-4">
		<div className="grid gap-4 md:grid-cols-3">
			<MetricCard
				title="Tributos deducibles"
				value={formatMoney(analysis.totalTributos)}
				detail="Ventas, fuerza, sellos, CSS y cuota"
				icon={<Landmark />}
				accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
			/>
			<MetricCard
				title="Otros deducibles"
				value={formatMoney(analysis.totalOtrosDeducibles)}
				detail="Restauracion, arrendamiento y otros"
				icon={<WalletCards />}
				accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
			/>
			<MetricCard
				title="Meses declarados"
				value={String(analysis.tributoRows)}
				detail="Filas con importes registrados"
				icon={<CalendarDays />}
				accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
			/>
		</div>
		<Card className="rounded-lg shadow-sm">
			<CardHeader className="p-4">
				<CardTitle className="text-base">Detalle de tributos</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[820px] text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
								<th className="py-3 pr-4">Mes</th>
								<th className="py-3 pr-4 text-right">Tributos</th>
								<th className="py-3 pr-4 text-right">Otros deducibles</th>
								<th className="py-3 pr-4 text-right">Total pagado</th>
							</tr>
						</thead>
						<tbody>
							{MONTH_CODES.map((month, index) => {
								const row = getTributoRow(workspace.registro, index);
								const taxes = tributoTotal(row, TRIBUTO_DEDUCIBLE_FIELDS);
								const others = tributoTotal(row, OTHER_DEDUCTIBLE_FIELDS);
								return (
									<tr key={month} className="border-b border-slate-100 dark:border-slate-800/80">
										<td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">{month}</td>
										<td className="py-3 pr-4 text-right">{formatMoney(taxes)}</td>
										<td className="py-3 pr-4 text-right">{formatMoney(others)}</td>
										<td className="py-3 pr-4 text-right font-semibold">{formatMoney(taxes + others)}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	</div>
);

const ResumenView: FC<{ analysis: WorkspaceAnalysis }> = ({ analysis }) => (
	<div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
		<MonthlyChart analysis={analysis} />
		<div className="space-y-4">
			<MetricCard
				title="Base imponible"
				value={formatMoney(analysis.baseImponible)}
				detail="Ingresos menos gastos y deducciones"
				icon={<LayoutDashboard />}
				accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
			/>
			<MetricCard
				title="Impuesto estimado"
				value={formatMoney(analysis.impuestoEstimado)}
				detail="Estimacion referencial al 15%"
				icon={<Landmark />}
				accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
			/>
			<MetricCard
				title="Operaciones registradas"
				value={String(analysis.incomeRows + analysis.expenseRows)}
				detail={`${analysis.incomeRows} ingresos / ${analysis.expenseRows} gastos`}
				icon={<Archive />}
				accent="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
			/>
		</div>
	</div>
);

const InventoryView: FC<{ workspace: CloudWorkspaceEntry }> = ({ workspace }) => {
	const { inventario } = workspace.registro;
	const operations = inventario.operaciones.slice(-8).reverse();

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-4">
				<MetricCard title="Productos" value={String(inventario.productos.length)} detail="Catalogo base" icon={<Boxes />} accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" />
				<MetricCard title="Almacenes" value={String(inventario.almacenes.length)} detail="Puntos de stock" icon={<PackageSearch />} accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" />
				<MetricCard title="Stock" value={String(inventario.stock.length)} detail="Registros visibles" icon={<Archive />} accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" />
				<MetricCard title="Operaciones" value={String(inventario.operaciones.length)} detail="Ventas y compras" icon={<ShoppingCart />} accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" />
			</div>
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Productos y ultimas operaciones</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 p-4 pt-0 lg:grid-cols-2">
					<div className="space-y-2">
						{inventario.productos.slice(0, 10).map((product) => (
							<div key={product.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
								<div className="min-w-0">
									<p className="truncate font-medium text-slate-950 dark:text-slate-50">{product.nombre}</p>
									<p className="text-xs text-slate-500 dark:text-slate-400">{product.unidad || "Sin unidad"} / {product.tipo || "Sin tipo"}</p>
								</div>
								<span className="shrink-0 text-sm font-semibold">{formatMoney(product.precio)}</span>
							</div>
						))}
						{inventario.productos.length === 0 && <EmptyState title="Sin productos" description="Este espacio no tiene productos en inventario." icon={<Boxes />} />}
					</div>
					<div className="space-y-2">
						{operations.map((operation) => (
							<div key={operation.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
								<div className="flex items-center justify-between gap-3">
									<p className="font-medium text-slate-950 dark:text-slate-50">{operation.nombreProducto}</p>
									<Badge variant={operation.tipo === "venta" ? "default" : "secondary"}>{operation.tipo}</Badge>
								</div>
								<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
									{operation.fecha} / {operation.cantidad} {operation.unidad} / {formatMoney(operation.total)}
								</p>
							</div>
						))}
						{operations.length === 0 && <EmptyState title="Sin operaciones" description="No hay ventas o compras registradas todavia." icon={<ShoppingCart />} />}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

const TercerosView: FC<{ workspace: CloudWorkspaceEntry }> = ({ workspace }) => {
	const terceros = workspace.registro.terceros;
	const pendiente = terceros.cuentas.reduce((total, cuenta) => total + cuenta.montoPendiente, 0);

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-3">
				<MetricCard title="Terceros" value={String(terceros.terceros.length)} detail="Clientes, proveedores y estado" icon={<Users />} accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" />
				<MetricCard title="Cuentas abiertas" value={String(terceros.cuentas.length)} detail="Deudas y prestamos" icon={<WalletCards />} accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" />
				<MetricCard title="Pendiente" value={formatMoney(pendiente)} detail="Saldo por cobrar o pagar" icon={<Landmark />} accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" />
			</div>
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Directorio</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 p-4 pt-0 md:grid-cols-2 xl:grid-cols-3">
					{terceros.terceros.map((tercero) => (
						<div key={tercero.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
							<p className="font-semibold text-slate-950 dark:text-slate-50">{tercero.nombre}</p>
							<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tercero.tipoEntidad} / {tercero.identificadorFiscal || "Sin identificador"}</p>
							<p className="mt-2 break-words text-xs text-slate-500 dark:text-slate-400">{tercero.telefono || tercero.correo || tercero.direccion || "Sin contacto"}</p>
						</div>
					))}
					{terceros.terceros.length === 0 && <EmptyState title="Sin terceros" description="No hay clientes o proveedores guardados en este espacio." icon={<Users />} />}
				</CardContent>
			</Card>
		</div>
	);
};

const CatalogosView: FC<{ workspace: CloudWorkspaceEntry }> = ({ workspace }) => {
	const cuentas = workspace.accounting.cuentasContables;
	const productos = workspace.registro.inventario.productos;

	return (
		<div className="grid gap-4 xl:grid-cols-2">
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Cuentas contables</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 p-4 pt-0">
					{cuentas.slice(0, 16).map((cuenta) => (
						<div key={cuenta.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
							<div className="min-w-0">
								<p className="truncate font-medium text-slate-950 dark:text-slate-50">{cuenta.codigo} / {cuenta.nombre}</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">{cuenta.tipo} / {cuenta.naturaleza}</p>
							</div>
							<Badge variant={cuenta.activo ? "default" : "secondary"}>{cuenta.activo ? "Activa" : "Inactiva"}</Badge>
						</div>
					))}
					{cuentas.length === 0 && <EmptyState title="Sin cuentas" description="El catalogo contable esta vacio." icon={<List />} />}
				</CardContent>
			</Card>
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Productos</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 p-4 pt-0">
					{productos.slice(0, 16).map((product) => (
						<div key={product.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
							<div className="min-w-0">
								<p className="truncate font-medium text-slate-950 dark:text-slate-50">{product.nombre}</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">{product.descripcion || product.tipo || "Sin descripcion"}</p>
							</div>
							<span className="shrink-0 text-sm font-semibold">{formatMoney(product.precio)}</span>
						</div>
					))}
					{productos.length === 0 && <EmptyState title="Sin productos" description="No hay productos disponibles para mostrar." icon={<Boxes />} />}
				</CardContent>
			</Card>
		</div>
	);
};

const SupportView: FC<{ view: GcTcpView }> = ({ view }) => {
	const content: Record<"documentos" | "seguridad" | "licencias" | "acerca" | "ayuda" | "recursos" | "nomencladores", { title: string; description: string; icon: ReactNode }> = {
		documentos: {
			title: "Documentos",
			description: "Vista preparada para listar modelos, reportes y documentos asociados al registro contable cuando el backend exponga esa coleccion.",
			icon: <FileText />,
		},
		seguridad: {
			title: "Seguridad y cuenta",
			description: "La version de escritorio reserva este espacio para datos de acceso, sincronizacion y proteccion de la cuenta.",
			icon: <Shield />,
		},
		licencias: {
			title: "Licencias y creditos",
			description: "Centro reservado para visualizar estado de licencia, creditos e informacion comercial del usuario.",
			icon: <CreditCard />,
		},
		acerca: {
			title: "Gestor Contable TCP",
			description: "Version de escritorio integrada al cliente principal de SYSGD para leer, analizar y visualizar workspaces contables.",
			icon: <Info />,
		},
		ayuda: {
			title: "Ayuda de llenado",
			description: "Area reservada para guias de llenado del registro, tributos y declaracion jurada.",
			icon: <CircleHelp />,
		},
		recursos: {
			title: "Recursos utiles",
			description: "Area reservada para enlaces, formularios y referencias contables relacionadas con TCP.",
			icon: <Search />,
		},
		nomencladores: {
			title: "Nomencladores",
			description: "Usa Catalogo para visualizar cuentas y productos. Esta vista queda lista para edicion avanzada.",
			icon: <List />,
		},
	};

	const item = content[view as keyof typeof content];
	return <EmptyState title={item.title} description={item.description} icon={item.icon} />;
};

const GC_TCP: FC = () => {
	const { toast } = useToast();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<LedgerApiResponse | null>(null);
	const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
	const [selectedView, setSelectedView] = useState<GcTcpView>("dashboard");
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [savingWorkspace, setSavingWorkspace] = useState(false);

	const loadLedger = useCallback(async () => {
		setLoading(true);
		try {
			const { data: response } = await api.get<LedgerApiResponse>("/api/cont-ledger");
			setData(response);
			const ledger = response.registro;
			const firstWorkspace = ledger?.workspaces[0];
			setActiveWorkspaceId(ledger?.activeWorkspaceId || firstWorkspace?.id || "");
		} catch {
			toast({
				title: "Error",
				description: "No se pudo cargar el registro contable",
				variant: "destructive",
			});
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		void loadLedger();
	}, [loadLedger]);

	const ledger = data?.registro ?? null;
	const analyses = useMemo(
		() => ledger?.workspaces.map((workspace) => calculateWorkspaceAnalysis(workspace)) ?? [],
		[ledger],
	);
	const activeAnalysis = analyses.find((analysis) => analysis.workspace.id === activeWorkspaceId) ?? analyses[0] ?? null;
	const activeWorkspace = activeAnalysis?.workspace ?? null;

	const totals = useMemo(
		() => ({
			ingresos: analyses.reduce((total, analysis) => total + analysis.totalIngresos, 0),
			gastos: analyses.reduce((total, analysis) => total + analysis.totalGastos, 0),
			neto: analyses.reduce((total, analysis) => total + analysis.baseImponible, 0),
			asientos: analyses.reduce((total, analysis) => total + analysis.incomeRows + analysis.expenseRows, 0),
		}),
		[analyses],
	);

	const handleSelectWorkspace = async (workspaceId: string) => {
		if (!ledger || workspaceId === activeWorkspaceId) return;
		const updatedLedger: CloudLedgerContainer = { ...ledger, activeWorkspaceId: workspaceId };
		setActiveWorkspaceId(workspaceId);
		setData((current) => current ? { ...current, registro: updatedLedger } : current);
		setSavingWorkspace(true);
		try {
			await api.put("/api/cont-ledger", {
				registro: updatedLedger,
				inventarioRegistro: data?.inventarioRegistro ?? null,
			});
			toast({ title: "Espacio activo actualizado" });
		} catch {
			setActiveWorkspaceId(ledger.activeWorkspaceId);
			setData((current) => current ? { ...current, registro: ledger } : current);
			toast({
				title: "No se pudo guardar el espacio activo",
				description: "La vista cambio se revirtio para mantener la sincronizacion.",
				variant: "destructive",
			});
		} finally {
			setSavingWorkspace(false);
		}
	};

	const renderContent = () => {
		if (!activeWorkspace || !activeAnalysis) {
			return <EmptyState title="Sin espacio activo" description="Selecciona o carga un respaldo para visualizar el registro." icon={<DatabaseBackup />} />;
		}

		switch (selectedView) {
			case "dashboard":
				return (
					<div className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
							<MetricCard title="Ingresos" value={formatMoney(totals.ingresos)} detail="Todos los espacios" icon={<TrendingUp />} accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" />
							<MetricCard title="Gastos" value={formatMoney(totals.gastos)} detail="Todos los espacios" icon={<TrendingDown />} accent="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" />
							<MetricCard title="Base imponible" value={formatMoney(totals.neto)} detail="Lectura consolidada" icon={<Landmark />} accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" />
							<MetricCard title="Asientos" value={String(totals.asientos)} detail="Ingresos y gastos" icon={<Archive />} accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" />
						</div>
						<WorkspaceSelector analyses={analyses} activeWorkspaceId={activeWorkspace.id} onSelect={handleSelectWorkspace} savingWorkspace={savingWorkspace} />
						<ResumenView analysis={activeAnalysis} />
					</div>
				);
			case "generales":
				return <GeneralView workspace={activeWorkspace} analysis={activeAnalysis} />;
			case "ingresos":
				return <EntriesView workspace={activeWorkspace} type="ingresos" />;
			case "gastos":
				return <EntriesView workspace={activeWorkspace} type="gastos" />;
			case "tributos":
				return <TributosView workspace={activeWorkspace} analysis={activeAnalysis} />;
			case "resumen":
				return <ResumenView analysis={activeAnalysis} />;
			case "ventas":
				return <InventoryView workspace={activeWorkspace} />;
			case "terceros":
				return <TercerosView workspace={activeWorkspace} />;
			case "catalogos":
				return <CatalogosView workspace={activeWorkspace} />;
			case "respaldo":
				return <UploadBackupPanel onSuccess={loadLedger} />;
			case "nomencladores":
			case "documentos":
			case "seguridad":
			case "licencias":
			case "acerca":
			case "ayuda":
			case "recursos":
				return <SupportView view={selectedView} />;
			default:
				return null;
		}
	};

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
				Cargando registro contable...
			</div>
		);
	}

	if (!ledger || ledger.workspaces.length === 0) {
		return (
			<div className="h-full w-full overflow-auto bg-slate-50 p-4 dark:bg-slate-950">
				<div className="mx-auto max-w-4xl">
					<UploadBackupPanel onSuccess={loadLedger} />
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
			<div className="hidden lg:block">
				<GcTcpSidebar view={selectedView} onSelect={setSelectedView} />
			</div>
			{isMobileSidebarOpen && (
				<div className="fixed inset-0 z-50 flex lg:hidden">
					<button
						type="button"
						className="absolute inset-0 bg-slate-950/60"
						aria-label="Cerrar menu"
						onClick={() => setIsMobileSidebarOpen(false)}
					/>
					<div className="relative h-full">
						<GcTcpSidebar view={selectedView} onSelect={setSelectedView} onClose={() => setIsMobileSidebarOpen(false)} />
					</div>
				</div>
			)}
			<main className="min-w-0 flex-1 overflow-auto">
				<header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							<Button variant="outline" size="icon" className="lg:hidden" onClick={() => setIsMobileSidebarOpen(true)} aria-label="Abrir menu">
								<Menu />
							</Button>
							<div className="min-w-0">
								<p className="text-xs font-medium uppercase text-emerald-700 dark:text-emerald-300">GC TCP escritorio</p>
								<h1 className="truncate text-xl font-semibold text-slate-950 dark:text-slate-50">{getViewTitle(selectedView)}</h1>
								<p className="truncate text-sm text-slate-500 dark:text-slate-400">
									{activeWorkspace?.name ?? "Sin espacio"} / {formatDate(data?.updatedAt ?? null)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="outline">{ledger.workspaces.length} workspace{ledger.workspaces.length === 1 ? "" : "s"}</Badge>
							<Button variant="outline" size="sm" onClick={loadLedger} disabled={loading || savingWorkspace}>
								<RefreshCw className={cn(savingWorkspace && "animate-spin")} />
								Actualizar
							</Button>
						</div>
					</div>
					<Separator className="mt-3 lg:hidden" />
				</header>
				<div className="p-4 sm:p-6">{renderContent()}</div>
			</main>
		</div>
	);
};

export default GC_TCP;
