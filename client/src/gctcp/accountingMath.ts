import type {
	CloudWorkspaceEntry,
	DayAmountRow,
	GeneralesData,
	MonthCode,
	MonthEntries,
	RegistroAnualTCP,
	RegistroTCP,
	TributoRow,
} from "../accounting/core/types/accountingTypes";
import { MONTH_CODES, MONTH_NAMES } from "../accounting/core/utils/constants";
import type { WorkspaceAnalysis } from "./types";


export const normalizeLedgerYear = (value: number | string | null | undefined): number => {
	const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
	return Number.isFinite(parsed) && parsed > 1900 ? parsed : new Date().getFullYear();
};

const createEmptyMonthRows = (year: number, key: "ingresos" | "gastos", month: MonthCode): DayAmountRow[] =>
	Array.from({ length: 36 }, (_, index) => ({
		id: `${key}-${year}-${month}-${index + 1}`,
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
		otros: "",
		restauracion: "",
		arrendamiento: "",
		exonerado: "",
		otrosMFP: "",
		cuotaMensual: "",
	}));

export const createEmptyAnnualRegistro = (year: number): RegistroAnualTCP => ({
	ingresos: createEmptyMonthEntries(year, "ingresos"),
	gastos: createEmptyMonthEntries(year, "gastos"),
	tributos: createEmptyTributoRows(),
});

export const getRegistroAnnualData = (registro: RegistroTCP, year: number): RegistroAnualTCP => {
	const normalizedYear = normalizeLedgerYear(year);
	const yearKey = String(normalizedYear);
	const annualData = registro.registrosPorAnio?.[yearKey];
	if (annualData) return annualData;

	const rootYear = normalizeLedgerYear(registro.generales?.anio);
	if (rootYear === normalizedYear) {
		return {
			ingresos: registro.ingresos,
			gastos: registro.gastos,
			tributos: registro.tributos,
		};
	}

	return createEmptyAnnualRegistro(normalizedYear);
};

export const getWorkspaceForYear = (workspace: CloudWorkspaceEntry, year: number): CloudWorkspaceEntry => {
	const normalizedYear = normalizeLedgerYear(year);
	const annualData = getRegistroAnnualData(workspace.registro, normalizedYear);
	return {
		...workspace,
		registro: {
			...workspace.registro,
			generales: {
				...workspace.registro.generales,
				anio: normalizedYear,
			},
			ingresos: annualData.ingresos,
			gastos: annualData.gastos,
			tributos: annualData.tributos,
		},
	};
};

export const ensureRegistroYear = (registro: RegistroTCP, year: number): RegistroTCP => {
	const normalizedYear = normalizeLedgerYear(year);
	const rootYear = normalizeLedgerYear(registro.generales?.anio);
	const currentYears = registro.registrosPorAnio ?? {};
	const yearsWithRoot = currentYears[String(rootYear)]
		? currentYears
		: {
				...currentYears,
				[String(rootYear)]: {
					ingresos: registro.ingresos,
					gastos: registro.gastos,
					tributos: registro.tributos,
				},
			};
	const selectedAnnualData = yearsWithRoot[String(normalizedYear)] ?? createEmptyAnnualRegistro(normalizedYear);
	const nextYears = {
		...yearsWithRoot,
		[String(normalizedYear)]: selectedAnnualData,
	};

	return {
		...registro,
		generales: {
			...registro.generales,
			anio: normalizedYear,
		},
		ingresos: selectedAnnualData.ingresos,
		gastos: selectedAnnualData.gastos,
		tributos: selectedAnnualData.tributos,
		registrosPorAnio: nextYears,
	};
};

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
		workspace.registro.inventario.operaciones.forEach((operation) => {
			const operationYear = Number.parseInt(operation.fecha.slice(0, 4), 10);
			if (Number.isFinite(operationYear)) yearSet.add(operationYear);
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
