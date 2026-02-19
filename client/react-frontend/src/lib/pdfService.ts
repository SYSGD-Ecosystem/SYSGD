import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";

(pdfMake as any).vfs = pdfFonts.vfs;

export type MonthCode =
	| "ENE"
	| "FEB"
	| "MAR"
	| "ABR"
	| "MAY"
	| "JUN"
	| "JUL"
	| "AGO"
	| "SEP"
	| "OCT"
	| "NOV"
	| "DIC";

export type GeneralData = {
	anio: string;
	nombre: string;
	nit: string;
	fiscalCalle: string;
	fiscalMunicipio: string;
	fiscalProvincia: string;
	legalCalle: string;
	legalMunicipio: string;
	legalProvincia: string;
	actividad: string;
	codigo: string;
	firmaDia: string;
	firmaMes: string;
	firmaAnio: string;
};

export type MonthEntry = { dia: string; importe: string };
export type MonthEntries = Record<MonthCode, MonthEntry[]>;

export type TributosEntry = {
	mes: string;
	b: string;
	c: string;
	d: string;
	e: string;
	f: string;
	h: string;
	i: string;
	j: string;
	l: string;
	m: string;
	n: string;
	o: string;
	p: string;
};

export type TcpDocumentData = {
	generalData: GeneralData;
	ingresos: MonthEntries;
	gastos: MonthEntries;
	tributos: TributosEntry[];
};

const monthCodes: MonthCode[] = [
	"ENE",
	"FEB",
	"MAR",
	"ABR",
	"MAY",
	"JUN",
	"JUL",
	"AGO",
	"SEP",
	"OCT",
	"NOV",
	"DIC",
];

const parseCurrency = (value: string): number => {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value: number): string => {
	return value.toFixed(2);
};

const getMonthTotal = (entries: MonthEntry[]): number =>
	entries.reduce((acc, curr) => acc + parseCurrency(curr.importe), 0);

const generateGeneralesContent = (data: GeneralData): Content => {
	return {
		table: {
			widths: ["*", "*", "*", "*", "*", "*", "*", "*"],
			body: [
				[
					{ rowSpan: 2, text: "", border: [true, true, false, true] },
					{ rowSpan: 2, colSpan: 5, text: "REGISTRO DE INGRESOS Y GASTOS\nPARA EL TRABAJO POR CUENTA PROPIA", bold: true, fontSize: 12, alignment: "center", border: [false, true, false, true] },
					{ colSpan: 2, text: "Año", alignment: "center", fontSize: 10, border: [false, true, true, false] },
					{ text: "", border: [false, true, true, true] },
				],
				[
					{ text: "", border: [true, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: data.anio || "", alignment: "center", bold: true, fontSize: 11, border: [false, false, true, false] },
					{ text: "", border: [false, false, true, true] },
				],
				[
					{ colSpan: 6, text: "Nombre(s) y Apellidos del Contribuyente", fontSize: 9, border: [true, true, false, true] },
					{ text: "", border: [false, true, false, true] },
					{ text: "", border: [false, true, false, true] },
					{ text: "", border: [false, true, false, true] },
					{ text: "", border: [false, true, false, true] },
					{ text: "", border: [false, true, false, true] },
					{ colSpan: 2, text: "NIT", fontSize: 9, border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
				],
				[
					{ colSpan: 6, text: data.nombre || "", alignment: "left", fontSize: 10, border: [true, false, false, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ text: "", border: [false, false, false, true] },
					{ colSpan: 2, text: data.nit || "", alignment: "left", fontSize: 10, border: [false, false, true, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ text: "", border: [false, false, true, true] },
				],
				[
					{ colSpan: 8, text: "Domicilio fiscal: (lugar donde desarrolla la actividad): calle, No, apto, entre calles:", fontSize: 9, border: [true, true, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
				],
				[
					{ colSpan: 8, text: data.fiscalCalle || "", alignment: "left", fontSize: 10, border: [true, false, true, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
				],
				[
					{ colSpan: 2, text: "Municipio:", fontSize: 9, border: [true, true, false, true] },
					{ colSpan: 2, text: data.fiscalMunicipio || "", alignment: "left", fontSize: 10, border: [false, true, false, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ colSpan: 2, text: "Provincia:", fontSize: 9, border: [false, true, false, true] },
					{ colSpan: 2, text: data.fiscalProvincia || "", alignment: "left", fontSize: 10, border: [false, true, true, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
				],
				[
					{ colSpan: 8, text: "Domicilio legal: (según Carnet de Identidad): calle, No, Apto, entre calles.", fontSize: 9, border: [true, true, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
					{ text: "", border: [true, false, true, false] },
				],
				[
					{ colSpan: 8, text: data.legalCalle || "", alignment: "left", fontSize: 10, border: [true, false, true, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
					{ text: "", border: [false, false, true, true] },
				],
				[
					{ colSpan: 2, text: "Municipio:", fontSize: 9, border: [true, true, false, true] },
					{ colSpan: 2, text: data.legalMunicipio || "", alignment: "left", fontSize: 10, border: [false, true, false, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ colSpan: 2, text: "Provincia:", fontSize: 9, border: [false, true, false, true] },
					{ colSpan: 2, text: data.legalProvincia || "", alignment: "left", fontSize: 10, border: [false, true, true, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
				],
				[
					{ colSpan: 1, text: "Actividad:", fontSize: 9, border: [true, true, false, true] },
					{ colSpan: 5, text: data.actividad || "", alignment: "left", fontSize: 10, border: [false, true, false, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ colSpan: 1, text: "Código:", fontSize: 9, border: [false, true, false, true] },
					{ colSpan: 1, text: data.codigo || "", alignment: "left", fontSize: 10, border: [false, true, true, true], margin: [2, 2, 2, 2] as [number, number, number, number] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
				],
				[
					{ text: "D", fontSize: 8, alignment: "center", border: [true, true, false, true] },
					{ text: "M", fontSize: 8, alignment: "center", border: [false, true, false, true] },
					{ text: "A", fontSize: 8, alignment: "center", border: [false, true, false, true] },
					{ text: data.firmaDia || "", alignment: "center", fontSize: 10, border: [false, true, false, true] },
					{ text: data.firmaMes || "", alignment: "center", fontSize: 10, border: [false, true, false, true] },
					{ text: data.firmaAnio || "", alignment: "center", fontSize: 10, border: [false, true, true, true] },
					{ colSpan: 2, text: "Firma del contribuyente", alignment: "center", fontSize: 9, border: [false, true, true, true] },
					{ text: "", border: [false, true, true, true] },
				],
			],
		},
		layout: {
			hLineWidth: () => 0.5,
			vLineWidth: () => 0.5,
		},
	};
};

const generateMonthEntriesContent = (
	title: string,
	entries: MonthEntries,
): Content => {
	const headerRow: TableCell[] = [];
	monthCodes.forEach((month) => {
		headerRow.push({ text: "D", bold: true, fontSize: 7, alignment: "center", fillColor: "#e2e8f0" });
		headerRow.push({ text: month, bold: true, fontSize: 7, alignment: "center", fillColor: "#e2e8f0" });
	});

	const body: TableCell[][] = [headerRow];

	for (let rowIdx = 0; rowIdx < 36; rowIdx++) {
		const row: TableCell[] = [];
		monthCodes.forEach((month) => {
			row.push({
				text: entries[month][rowIdx]?.dia || "",
				fontSize: 7,
				alignment: "center",
			});
			row.push({
				text: entries[month][rowIdx]?.importe || "",
				fontSize: 7,
				alignment: "right",
			});
		});
		body.push(row);
	}

	const totals = monthCodes.map((month) => getMonthTotal(entries[month]));
	const totalRow: TableCell[] = [];
	monthCodes.forEach((_, idx) => {
		totalRow.push({ text: "", border: [false, true, false, false] });
		totalRow.push({ text: formatCurrency(totals[idx]), bold: true, fontSize: 7, alignment: "right", border: [false, true, false, true] });
	});

	const annualTotal = totals.reduce((acc, val) => acc + val, 0);

	return {
		stack: [
			{
				text: title,
				bold: true,
				fontSize: 11,
				alignment: "center",
				fillColor: "#cbd5e1",
				margin: [0, 5, 0, 5] as [number, number, number, number],
			},
			{
				table: {
					widths: Array(24).fill(20),
					body,
				},
				layout: {
					hLineWidth: () => 0.3,
					vLineWidth: () => 0.3,
				},
			},
			{
				table: {
					widths: Array(24).fill(20),
					body: [
						[
							{ colSpan: 12, text: "Total", bold: true, alignment: "right", border: [true, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ text: "", border: [false, true, false, true] },
							{ colSpan: 12, text: formatCurrency(annualTotal), bold: true, alignment: "right", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
							{ text: "", border: [false, true, true, true] },
						],
					],
				},
				layout: {
					hLineWidth: () => 0.5,
					vLineWidth: () => 0.5,
				},
			},
		],
	};
};

const generateTributosContent = (tributos: TributosEntry[]): Content => {
	const body: TableCell[][] = [];

	const headerRow1: TableCell[] = [
		{ rowSpan: 3, text: "Mes", bold: true, fontSize: 9, alignment: "center", fillColor: "#e2e8f0" },
		{ colSpan: 9, text: "TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA", bold: true, fontSize: 9, alignment: "center", fillColor: "#e2e8f0" },
		{ rowSpan: 2, text: "Subtotal", bold: true, fontSize: 9, alignment: "center", fillColor: "#e2e8f0" },
		{ colSpan: 4, text: "Otros gastos deducibles", bold: true, fontSize: 9, alignment: "center", fillColor: "#e2e8f0" },
		{ rowSpan: 2, text: "Cuota Mensual (5%)", bold: true, fontSize: 9, alignment: "center", fillColor: "#e2e8f0" },
	];
	const headerRow2: TableCell[] = Array(9).fill(null).map(() => ({ text: "", rowSpan: 2, bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" }));
	const headerRow3: TableCell[] = [
		{ text: "1", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "2", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "3", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "4", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "5", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "6", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "7", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "8", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "9", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "10", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "11", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "12", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "13", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "14", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
		{ text: "15", bold: true, fontSize: 8, alignment: "center", fillColor: "#e2e8f0" },
	];

	const calculateRow = (row: TributosEntry) => {
		const g = parseCurrency(row.h) + parseCurrency(row.i);
		const k =
			parseCurrency(row.b) +
			parseCurrency(row.c) +
			parseCurrency(row.d) +
			parseCurrency(row.e) +
			parseCurrency(row.f) +
			g +
			parseCurrency(row.j);

		return { ...row, g, k };
	};

	const processedTributos = tributos.map(calculateRow);

	processedTributos.forEach((row) => {
		body.push([
			{ text: row.mes, fontSize: 8, alignment: "left" },
			{ text: row.b || "", fontSize: 7, alignment: "right" },
			{ text: row.c || "", fontSize: 7, alignment: "right" },
			{ text: row.d || "", fontSize: 7, alignment: "right" },
			{ text: row.e || "", fontSize: 7, alignment: "right" },
			{ text: row.f || "", fontSize: 7, alignment: "right" },
			{ text: row.g.toFixed(2), fontSize: 7, alignment: "right" },
			{ text: row.h || "", fontSize: 7, alignment: "right" },
			{ text: row.i || "", fontSize: 7, alignment: "right" },
			{ text: row.j || "", fontSize: 7, alignment: "right" },
			{ text: row.k.toFixed(2), fontSize: 7, alignment: "right", bold: true },
			{ text: row.l || "", fontSize: 7, alignment: "right" },
			{ text: row.m || "", fontSize: 7, alignment: "right" },
			{ text: row.n || "", fontSize: 7, alignment: "right" },
			{ text: row.o || "", fontSize: 7, alignment: "right" },
			{ text: row.p || "", fontSize: 7, alignment: "right" },
		]);
	});

	const totals = {
		b: 0,
		c: 0,
		d: 0,
		e: 0,
		f: 0,
		g: 0,
		h: 0,
		i: 0,
		j: 0,
		k: 0,
		l: 0,
		m: 0,
		n: 0,
		o: 0,
		p: 0,
	};

	processedTributos.forEach((row) => {
		totals.b += parseCurrency(row.b);
		totals.c += parseCurrency(row.c);
		totals.d += parseCurrency(row.d);
		totals.e += parseCurrency(row.e);
		totals.f += parseCurrency(row.f);
		totals.g += row.g;
		totals.h += parseCurrency(row.h);
		totals.i += parseCurrency(row.i);
		totals.j += parseCurrency(row.j);
		totals.k += row.k;
		totals.l += parseCurrency(row.l);
		totals.m += parseCurrency(row.m);
		totals.n += parseCurrency(row.n);
		totals.o += parseCurrency(row.o);
		totals.p += parseCurrency(row.p);
	});

	const totalRow: TableCell[] = [
		{ text: "Total pagado", bold: true, fontSize: 8, alignment: "left" },
		{ text: totals.b.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.c.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.d.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.e.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.f.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.g.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.h.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.i.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.j.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.k.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.l.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.m.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.n.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.o.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
		{ text: totals.p.toFixed(2), bold: true, fontSize: 7, alignment: "right" },
	];

	return {
		stack: [
			{
				text: "TRIBUTOS Y OTROS GASTOS ASOCIADOS A LA ACTIVIDAD",
				bold: true,
				fontSize: 11,
				alignment: "center",
				fillColor: "#cbd5e1",
				margin: [0, 10, 0, 5] as [number, number, number, number],
			},
			{
				table: {
					widths: [40, 25, 25, 25, 25, 25, 30, 30, 30, 30, 35, 30, 30, 30, 30, 35],
					body: [headerRow1, headerRow2, headerRow3, ...body, totalRow],
				},
				layout: {
					hLineWidth: () => 0.3,
					vLineWidth: () => 0.3,
				},
			},
		],
	};
};

export const generateTcpPdf = (data: TcpDocumentData): void => {
	const docDefinition: TDocumentDefinitions = {
		pageSize: "A4",
		pageOrientation: "landscape",
		pageMargins: [10, 10, 10, 10],
		content: [
			generateGeneralesContent(data.generalData),
			generateMonthEntriesContent("INGRESOS", data.ingresos),
			generateMonthEntriesContent("GASTOS", data.gastos),
			generateTributosContent(data.tributos),
		],
		defaultStyle: {
			font: "Roboto",
		},
	};

	pdfMake.createPdf(docDefinition).download(
		`Registro_TCP_${data.generalData.anio || new Date().getFullYear()}.pdf`,
	);
};
