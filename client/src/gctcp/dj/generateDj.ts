import type {
	CloudWorkspaceEntry,
	TributoRow,
} from "@/accounting/core/types/accountingTypes";
import { MONTH_CODES } from "@/accounting/core/utils/constants";
import {
	generateTcpPdf,
	type MonthEntries as PdfMonthEntries,
	type TributosEntry,
} from "@/lib/pdfService";
import { normalizeLedgerYear } from "../accountingMath";
import {
	applyAutoCalculatedTributos,
	getTributoConfigs,
} from "../tributos/tributoMath";

export interface DjSignature {
	dia: string;
	mes: string;
	anio: string;
}

const toPdfMonthEntries = (
	workspace: CloudWorkspaceEntry,
	key: "ingresos" | "gastos",
	year: number,
): PdfMonthEntries =>
	MONTH_CODES.reduce((result, month) => {
		result[month] = (workspace.registro[key][month] ?? [])
			.filter((row) => normalizeLedgerYear(row.anio ?? year) === year)
			.map((row) => ({ dia: row.dia, importe: row.importe }));
		return result;
	}, {} as PdfMonthEntries);

const toPdfTributos = (tributos: TributoRow[]): TributosEntry[] =>
	tributos.map((row) => ({
		mes: row.mes,
		b: row.ventas,
		c: row.fuerza,
		d: row.sellos,
		e: row.anuncios,
		f: row.css20,
		h: row.css14,
		i: row.cssSubsidio,
		j: row.otros,
		l: row.restauracion,
		m: row.arrendamiento,
		n: row.exonerado,
		o: row.otrosMFP,
		p: row.cuotaMensual,
	}));

/**
 * Construye y descarga la Declaración Jurada del workspace activo.
 * Usa el mismo payload que Android (TcpPdfPayload) y el generador offline
 * que ya existe en el cliente (pdfmake).
 */
export const generateDjPdf = (
	workspace: CloudWorkspaceEntry,
	year: number,
	signature: DjSignature = { dia: "", mes: "", anio: "" },
): void => {
	const general = workspace.registro.generales;
	const configs = getTributoConfigs(workspace);
	const relations = workspace.accounting.tributoCuentaBases ?? [];
	const accountByEntryId = new Map<string, string>();
	for (const relation of workspace.accounting.ingresoGastoCuentas ?? []) {
		accountByEntryId.set(relation.ingresoGastoId, relation.cuentaId);
	}
	const tributos = applyAutoCalculatedTributos({
		registro: workspace.registro,
		year,
		configs,
		relations,
		accountByEntryId,
	});

	generateTcpPdf({
		generalData: {
			anio: String(year),
			nombre: general.nombre,
			nit: general.nit,
			fiscalCalle: general.fiscalCalle,
			fiscalMunicipio: general.fiscalMunicipio,
			fiscalProvincia: general.fiscalProvincia,
			legalCalle: general.legalCalle,
			legalMunicipio: general.legalMunicipio,
			legalProvincia: general.legalProvincia,
			actividad: general.actividad,
			codigo: general.codigo,
			firmaDia: signature.dia,
			firmaMes: signature.mes,
			firmaAnio: signature.anio,
		},
		ingresos: toPdfMonthEntries(workspace, "ingresos", year),
		gastos: toPdfMonthEntries(workspace, "gastos", year),
		tributos: toPdfTributos(tributos),
	});
};
