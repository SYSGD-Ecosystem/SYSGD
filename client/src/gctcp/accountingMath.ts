import type {
	CloudLedgerContainer,
	CloudWorkspaceEntry,
	DayAmountRow,
	GeneralesData,
	HistorialPrecio,
	MonthCode,
	MonthEntries,
	OperacionInventario,
	RegistroTCP,
	TributoRow,
} from "../accounting/core/types/accountingTypes";
import { MONTH_CODES, MONTH_NAMES } from "../accounting/core/utils/constants";
import type { WorkspaceAnalysis } from "./types";


export const normalizeLedgerYear = (value: number | string | null | undefined): number => {
	const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
	return Number.isFinite(parsed) && parsed > 1900 ? parsed : new Date().getFullYear();
};

export const normalizeTimestamp = (value: unknown): number => {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		return value;
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return 0;
		const numeric = Number(trimmed);
		if (Number.isFinite(numeric) && numeric > 0) return numeric;
		const parsed = Date.parse(trimmed);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
	return 0;
};

const parseLegacyDateTime = (fecha: unknown, hora: unknown): number => {
	if (typeof fecha !== "string" || !fecha.trim()) return 0;
	const datePart = fecha.trim().slice(0, 10);
	const timePart =
		typeof hora === "string" && hora.trim() ? hora.trim().slice(0, 5) : "00:00";
	const parsed = Date.parse(`${datePart}T${timePart}:00`);
	return Number.isFinite(parsed) ? parsed : 0;
};

export const timestampYear = (value: unknown): number | null => {
	const time = normalizeTimestamp(value);
	if (!time) return null;
	return new Date(time).getFullYear();
};

export const formatTimestamp = (value: unknown): string => {
	const time = normalizeTimestamp(value);
	if (!time) return "Sin fecha";
	const date = new Date(time);
	const pad = (part: number) => String(part).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const createEmptyMonthRows = (year: number, key: "ingresos" | "gastos", month: MonthCode): DayAmountRow[] =>
	Array.from({ length: 36 }, (_, index) => ({
		id: `${key}-${year}-${month}-${index + 1}`,
		anio: year,
		dia: "",
		importe: "",
	}));

export const createEmptyMonthEntries = (year: number, key: "ingresos" | "gastos"): MonthEntries =>
	MONTH_CODES.reduce((entries, month) => ({
		...entries,
		[month]: createEmptyMonthRows(year, key, month),
	}), {} as MonthEntries);

export const createEmptyTributoRows = (): TributoRow[] =>
	MONTH_NAMES.map((mes) => ({
		mes,
		ventas: "",
		fuerza: "",
		sellos: "",
		anuncios: "",
		css20: "",
		css14: "",
		cssSubsidio: "",
		otros: "",
		restauracion: "",
		arrendamiento: "",
		exonerado: "",
		otrosMFP: "",
		cuotaMensual: "",
	}));

const ensureMonthEntries = (
	entries: MonthEntries | undefined,
	year: number,
	key: "ingresos" | "gastos",
): MonthEntries =>
	MONTH_CODES.reduce((result, month) => {
		const rows = entries?.[month] ?? [];
		result[month] = rows.length > 0 ? rows : createEmptyMonthRows(year, key, month);
		return result;
	}, {} as MonthEntries);

/**
 * Devuelve el workspace limitado al año fiscal indicado.
 *
 * Android guarda todos los años en los mismos mapas y distingue cada fila con
 * DayAmountRow.anio. Este helper replica ese comportamiento en la UI.
 */
export const getWorkspaceForYear = (
	workspace: CloudWorkspaceEntry,
	year: number,
): CloudWorkspaceEntry => {
	const normalizedYear = normalizeLedgerYear(year);
	const fallbackYear = normalizeLedgerYear(workspace.registro.generales?.anio);
	const legacy = workspace.registro.registrosPorAnio?.[String(normalizedYear)];

	const filterRows = (entries: MonthEntries): MonthEntries =>
		MONTH_CODES.reduce((result, month) => {
			result[month] = (entries[month] ?? []).filter(
				(row) => normalizeLedgerYear(row.anio ?? fallbackYear) === normalizedYear,
			);
			return result;
		}, {} as MonthEntries);

	return {
		...workspace,
		registro: {
			...workspace.registro,
			generales: {
				...workspace.registro.generales,
				anio: normalizedYear,
			},
			ingresos: legacy?.ingresos ?? filterRows(workspace.registro.ingresos),
			gastos: legacy?.gastos ?? filterRows(workspace.registro.gastos),
			tributos: legacy?.tributos ?? workspace.registro.tributos,
		},
	};
};

/**
 * Selecciona el año fiscal activo. No mueve datos: las filas ya llevan su
 * propio DayAmountRow.anio, igual que en Android.
 */
export const ensureRegistroYear = (
	registro: RegistroTCP,
	year: number,
): RegistroTCP => {
	const normalizedYear = normalizeLedgerYear(year);
	return {
		...registro,
		generales: {
			...registro.generales,
			anio: normalizedYear,
		},
		ingresos: ensureMonthEntries(registro.ingresos, normalizedYear, "ingresos"),
		gastos: ensureMonthEntries(registro.gastos, normalizedYear, "gastos"),
	};
};

const normalizeInventario = (
	inventario: RegistroTCP["inventario"],
): RegistroTCP["inventario"] => {
	if (!inventario) return inventario;

	const historialPrecios = (inventario.historialPrecios ?? []).map((precio) => {
		const legacy = precio as HistorialPrecio & {
			fechaDesde?: string;
			fechaDesdeLegacy?: string;
		};
		return {
			...precio,
			createdAt: normalizeTimestamp(
				legacy.createdAt ?? legacy.fechaDesde ?? legacy.fechaDesdeLegacy,
			),
		};
	});

	const operaciones = (inventario.operaciones ?? []).map((operacion) => {
		const legacy = operacion as OperacionInventario & {
			createAt?: number;
			fecha?: string;
		};
		return {
			...operacion,
			createdAt: normalizeTimestamp(
				legacy.createdAt ??
					legacy.createAt ??
					parseLegacyDateTime(legacy.fecha, legacy.hora),
			),
		};
	});

	return { ...inventario, historialPrecios, operaciones };
};

/**
 * Convierte datos legacy (registrosPorAnio y filas sin anio) al esquema de
 * Android: todos los años viven en los mismos mapas y cada fila lleva su anio.
 * Tambien elimina registrosPorAnio para no volver a duplicar datos.
 */
export const normalizeRegistroTCP = (registro: RegistroTCP): RegistroTCP => {
	const generalYear = normalizeLedgerYear(registro.generales?.anio);
	const legacy = registro.registrosPorAnio ?? {};

	const normalizeEntries = (key: "ingresos" | "gastos"): MonthEntries =>
		MONTH_CODES.reduce((result, month) => {
			const rows = [...(registro[key]?.[month] ?? [])];
			const ids = new Set(rows.map((row) => row.id));
			for (const [yearKey, annual] of Object.entries(legacy)) {
				const legacyYear = normalizeLedgerYear(yearKey);
				for (const row of annual[key]?.[month] ?? []) {
					if (ids.has(row.id)) continue;
					ids.add(row.id);
					rows.push({
						...row,
						anio: normalizeLedgerYear(row.anio ?? legacyYear),
					});
				}
			}
			result[month] = rows.map((row) => ({
				...row,
				anio: normalizeLedgerYear(row.anio ?? generalYear),
			}));
			return result;
		}, {} as MonthEntries);

	const legacyTributos = legacy[String(generalYear)]?.tributos;
	const tributos = registro.tributos?.length
		? registro.tributos
		: legacyTributos ?? [];

	return {
		generales: {
			...registro.generales,
			anio: generalYear,
		},
		ingresos: normalizeEntries("ingresos"),
		gastos: normalizeEntries("gastos"),
		tributos,
		inventario: normalizeInventario(registro.inventario),
		terceros: registro.terceros,
	};
};

export const normalizeWorkspaceForStorage = (
	workspace: CloudWorkspaceEntry,
): CloudWorkspaceEntry => ({
	...workspace,
	registro: normalizeRegistroTCP(workspace.registro),
});

export const normalizeContainerForStorage = (
	container: CloudLedgerContainer,
): CloudLedgerContainer => ({
	...container,
	workspaces: container.workspaces.map(normalizeWorkspaceForStorage),
});

export const getWorkspaceYears = (workspace: CloudWorkspaceEntry | null): number[] => {
	const yearSet = new Set<number>();
	const currentYear = new Date().getFullYear();
	yearSet.add(currentYear);
	yearSet.add(currentYear - 1);
	yearSet.add(currentYear + 1);

	if (workspace) {
		yearSet.add(normalizeLedgerYear(workspace.registro.generales?.anio));
		Object.keys(workspace.registro.registrosPorAnio ?? {}).forEach((yearKey) => {
			yearSet.add(normalizeLedgerYear(yearKey));
		});
		for (const key of ["ingresos", "gastos"] as const) {
			for (const rows of Object.values(workspace.registro[key] ?? {})) {
				for (const row of rows) {
					if (row.anio) yearSet.add(normalizeLedgerYear(row.anio));
				}
			}
		}
		workspace.registro.inventario.operaciones.forEach((operation) => {
			const operationYear = timestampYear(operation.createdAt);
			if (operationYear) yearSet.add(operationYear);
		});
	}

	return Array.from(yearSet).sort((a, b) => b - a);
};

export const EMPTY_GENERALES: GeneralesData = {
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
	"cssSubsidio",
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
	"cssSubsidio",
	"otros",
	"cuotaMensual",
];

const OTHER_DEDUCTIBLE_FIELDS: Array<keyof Omit<TributoRow, "mes">> = [
	"restauracion",
	"arrendamiento",
	"exonerado",
	"otrosMFP",
];

export const parseAmount = (value: string | number | null | undefined): number => {
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	if (!value) return 0;
	const normalized = value.replace(/\s/g, "").replace(",", ".");
	const parsed = Number.parseFloat(normalized);
	return Number.isFinite(parsed) ? parsed : 0;
};

export const formatMoney = (value: number): string =>
	new Intl.NumberFormat("es-CU", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);

export const formatLedgerDate = (value: string | null): string => {
	if (!value) return "Sin sincronizacion";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Fecha no disponible";
	return new Intl.DateTimeFormat("es-CU", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
};

export const getRows = (
	registro: RegistroTCP,
	key: "ingresos" | "gastos",
	month: MonthCode,
): DayAmountRow[] => registro[key][month] ?? [];

export const monthTotal = (rows: DayAmountRow[]): number =>
	rows.reduce((total, row) => total + parseAmount(row.importe), 0);

export const activeRows = (rows: DayAmountRow[]): DayAmountRow[] =>
	rows.filter((row) => row.dia.trim() !== "" || row.importe.trim() !== "");

export const tributoTotal = (
	row: TributoRow | undefined,
	fields: Array<keyof Omit<TributoRow, "mes">> = TRIBUTO_FIELDS,
): number => {
	if (!row) return 0;
	return fields.reduce((total, field) => total + parseAmount(row[field]), 0);
};

export const getTributoRow = (registro: RegistroTCP, monthIndex: number): TributoRow | undefined => {
	const monthName = MONTH_NAMES[monthIndex];
	const monthCode = MONTH_CODES[monthIndex];
	return registro.tributos.find((row) => row.mes === monthName || row.mes === monthCode);
};

export const calculateWorkspaceAnalysis = (workspace: CloudWorkspaceEntry): WorkspaceAnalysis => {
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
	const tributoRows = workspace.registro.tributos.filter((row) => tributoTotal(row) > 0).length;
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
	const baseImponible = totalIngresos - totalGastos - totalTributos - totalOtrosDeducibles;

	return {
		workspace,
		totalIngresos,
		totalGastos,
		totalTributos,
		totalOtrosDeducibles,
		baseImponible,
		impuestoEstimado: Math.max(0, baseImponible * 0.15),
		monthly,
		incomeRows,
		expenseRows,
		tributoRows,
		productCount: workspace.registro.inventario.productos.length,
		stockCount: workspace.registro.inventario.stock.length,
		thirdPartyCount: workspace.registro.terceros.terceros.length,
		accountCount: workspace.accounting.cuentasContables.length,
		lastMonthWithActivity: lastActiveMonth?.month ?? "Sin actividad",
		completenessScore: Math.round((completedFields / completenessFields.length) * 100),
	};
};
