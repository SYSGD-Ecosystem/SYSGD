import type {
	CloudWorkspaceEntry,
	RegistroTCP,
	TributoConfig,
	TributoCuentaBase,
	TributoKey,
	TributoRow,
} from "../../accounting/core/types/accountingTypes";
import { MONTH_CODES, MONTH_NAMES } from "../../accounting/core/utils/constants";
import { normalizeLedgerYear, parseAmount } from "../accountingMath";

export type TributoCategoria = "TRIBUTO" | "OTRO_DEDUCIBLE";

export type TributoDefinition = {
	key: TributoKey;
	nombre: string;
	categoria: TributoCategoria;
	porcentaje: number;
	incluido: boolean;
	autocalcular: boolean;
	orden: number;
	deducibleFijo: number;
};

/**
 * Espejo de TributoConfigsPorDefecto.kt (Android).
 * Cualquier cambio aquí debe reflejarse también en la app Android.
 */
export const TRIBUTO_DEFINICIONES: TributoDefinition[] = [
	{
		key: "ventas",
		nombre: "Impuesto sobre ventas y servicios",
		categoria: "TRIBUTO",
		porcentaje: 10,
		incluido: true,
		autocalcular: true,
		orden: 0,
		deducibleFijo: 0,
	},
	{
		key: "fuerza",
		nombre: "Impuesto por la utilización de la fuerza de trabajo",
		categoria: "TRIBUTO",
		porcentaje: 5,
		incluido: false,
		autocalcular: true,
		orden: 1,
		deducibleFijo: 0,
	},
	{
		key: "sellos",
		nombre: "Impuesto por documentos y sellos",
		categoria: "TRIBUTO",
		porcentaje: 0,
		incluido: false,
		autocalcular: false,
		orden: 2,
		deducibleFijo: 0,
	},
	{
		key: "anuncios",
		nombre: "Tasa por radicación de anuncios",
		categoria: "TRIBUTO",
		porcentaje: 0,
		incluido: false,
		autocalcular: false,
		orden: 3,
		deducibleFijo: 0,
	},
	{
		key: "css20",
		nombre: "Contribución Especial a la seguridad social 20%",
		categoria: "TRIBUTO",
		porcentaje: 20,
		incluido: false,
		autocalcular: false,
		orden: 4,
		deducibleFijo: 0,
	},
	{
		key: "css14",
		nombre: "Contribución a la seguridad social 12.5%",
		categoria: "TRIBUTO",
		porcentaje: 12.5,
		incluido: false,
		autocalcular: false,
		orden: 5,
		deducibleFijo: 0,
	},
	{
		key: "cssSubsidio",
		nombre: "CSS - Retención Para pago de subsidios a trabajadores 1.5%",
		categoria: "TRIBUTO",
		porcentaje: 1.5,
		incluido: false,
		autocalcular: false,
		orden: 6,
		deducibleFijo: 0,
	},
	{
		key: "otros",
		nombre: "Otros tributos",
		categoria: "TRIBUTO",
		porcentaje: 0,
		incluido: false,
		autocalcular: false,
		orden: 7,
		deducibleFijo: 0,
	},
	{
		key: "restauracion",
		nombre: "Contribución territorial para la restauración",
		categoria: "OTRO_DEDUCIBLE",
		porcentaje: 0,
		incluido: false,
		autocalcular: false,
		orden: 8,
		deducibleFijo: 0,
	},
	{
		key: "arrendamiento",
		nombre: "Pago de arrendamiento al Estado",
		categoria: "OTRO_DEDUCIBLE",
		porcentaje: 0,
		incluido: false,
		autocalcular: false,
		orden: 9,
		deducibleFijo: 0,
	},
	{
		key: "exonerado",
		nombre: "Exonerado por reparaciones constructivas",
		categoria: "OTRO_DEDUCIBLE",
		porcentaje: 0,
		incluido: false,
		autocalcular: false,
		orden: 10,
		deducibleFijo: 0,
	},
	{
		key: "otrosMFP",
		nombre: "Otros gastos deducibles autorizados por MFP",
		categoria: "OTRO_DEDUCIBLE",
		porcentaje: 0,
		incluido: false,
		autocalcular: false,
		orden: 11,
		deducibleFijo: 0,
	},
	{
		key: "cuotaMensual",
		nombre: "Cuota mensual 5%",
		categoria: "OTRO_DEDUCIBLE",
		porcentaje: 5,
		incluido: false,
		autocalcular: false,
		orden: 12,
		deducibleFijo: 3260,
	},
];

export const TRIBUTO_FIELD: Record<TributoKey, keyof Omit<TributoRow, "mes">> = {
	ventas: "ventas",
	fuerza: "fuerza",
	sellos: "sellos",
	anuncios: "anuncios",
	css20: "css20",
	css14: "css14",
	cssSubsidio: "cssSubsidio",
	otros: "otros",
	restauracion: "restauracion",
	arrendamiento: "arrendamiento",
	exonerado: "exonerado",
	otrosMFP: "otrosMFP",
	cuotaMensual: "cuotaMensual",
};

const definitionToConfig = (definition: TributoDefinition): TributoConfig => ({
	key: definition.key,
	nombre: definition.nombre,
	categoria: definition.categoria,
	porcentaje: definition.porcentaje,
	incluido: definition.incluido,
	autocalcular: definition.autocalcular,
	orden: definition.orden,
	deducibleFijo: definition.deducibleFijo,
	updatedAt: Date.now(),
});

export const createDefaultTributoConfigs = (): TributoConfig[] =>
	TRIBUTO_DEFINICIONES.map(definitionToConfig);

/**
 * Devuelve la configuración persistida y completa los conceptos que falten
 * con los valores por defecto de Android. No escribe en el ledger.
 */
export const getTributoConfigs = (workspace: CloudWorkspaceEntry): TributoConfig[] => {
	const existing = workspace.accounting?.tributoConfigs ?? [];
	const byKey = new Map(existing.map((config) => [config.key, config]));
	return TRIBUTO_DEFINICIONES.map((definition) => {
		const config = byKey.get(definition.key);
		return config
			? {
					...definitionToConfig(definition),
					...config,
					deducibleFijo: config.deducibleFijo ?? 0,
				}
			: definitionToConfig(definition);
	});
};

export const createEmptyTributoRow = (mes: string): TributoRow => ({
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
});

export const getTributoValue = (row: TributoRow, key: TributoKey): string =>
	row[TRIBUTO_FIELD[key]] ?? "";

export const setTributoValue = (
	row: TributoRow,
	key: TributoKey,
	value: string,
): TributoRow => ({
	...row,
	[TRIBUTO_FIELD[key]]: value,
});

export const ensureTributoRows = (rows: TributoRow[]): TributoRow[] =>
	MONTH_NAMES.map((mes, index) => {
		const monthCode = MONTH_CODES[index];
		const row =
			rows.find((item) => item.mes === mes || item.mes === monthCode) ??
			createEmptyTributoRow(mes);
		return { ...createEmptyTributoRow(mes), ...row, mes };
	});

export const getTributoRowForMonth = (
	registro: RegistroTCP,
	monthIndex: number,
): TributoRow => {
	const monthName = MONTH_NAMES[monthIndex];
	const monthCode = MONTH_CODES[monthIndex];
	return (
		registro.tributos.find(
			(row) => row.mes === monthName || row.mes === monthCode,
		) ?? createEmptyTributoRow(monthName)
	);
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

interface ApplyAutoTributosParams {
	registro: RegistroTCP;
	year: number;
	configs: TributoConfig[];
	relations: TributoCuentaBase[];
	accountByEntryId: Map<string, string>;
}

/**
 * Réplica de LedgerRepository.applyAutoCalculatedTributos (Android).
 * Devuelve las 12 filas de tributos con los valores automáticos recalculados.
 */
export const applyAutoCalculatedTributos = ({
	registro,
	year,
	configs,
	relations,
	accountByEntryId,
}: ApplyAutoTributosParams): TributoRow[] => {
	const relationsByKey = new Map<TributoKey, Set<string>>();
	for (const relation of relations) {
		const current = relationsByKey.get(relation.tributoKey) ?? new Set<string>();
		current.add(relation.cuentaId);
		relationsByKey.set(relation.tributoKey, current);
	}

	const sortedConfigs = [...configs].sort((a, b) => a.orden - b.orden);

	return MONTH_CODES.map((monthCode, index) => {
		const current = getTributoRowForMonth(registro, index);
		const monthName = MONTH_NAMES[index];
		const base = current.mes.trim() ? current : { ...current, mes: monthName };

		return sortedConfigs.reduce((row, config) => {
			if (!config.incluido) {
				return setTributoValue(row, config.key, "");
			}
			if (!config.autocalcular) {
				return row;
			}

			const selectedAccounts = relationsByKey.get(config.key) ?? new Set<string>();
			const monthRows = [
				...(registro.ingresos[monthCode] ?? []),
				...(registro.gastos[monthCode] ?? []),
			].filter((entry) => {
				if (normalizeLedgerYear(entry.anio ?? year) !== year) return false;
				const accountId = accountByEntryId.get(entry.id);
				return accountId ? selectedAccounts.has(accountId) : false;
			});

			const baseImponible = round2(
				monthRows.reduce((total, entry) => total + parseAmount(entry.importe), 0),
			);
			const baseGravable = Math.max(baseImponible - config.deducibleFijo, 0);
			const monto =
				baseGravable > 0 && config.porcentaje > 0
					? round2((baseGravable * config.porcentaje) / 100).toFixed(2)
					: "";

			return setTributoValue(row, config.key, monto);
		}, base);
	});
};

/**
 * Recalcula los tributos automáticos del workspace para el año indicado.
 */
export const recalculateWorkspaceTributos = (
	workspace: CloudWorkspaceEntry,
	year: number,
): CloudWorkspaceEntry => {
	const configs = getTributoConfigs(workspace);
	const relations = workspace.accounting.tributoCuentaBases ?? [];
	const accountByEntryId = new Map<string, string>();
	for (const relation of workspace.accounting.ingresoGastoCuentas ?? []) {
		accountByEntryId.set(relation.ingresoGastoId, relation.cuentaId);
	}

	return {
		...workspace,
		registro: {
			...workspace.registro,
			tributos: applyAutoCalculatedTributos({
				registro: workspace.registro,
				year,
				configs,
				relations,
				accountByEntryId,
			}),
		},
	};
};
