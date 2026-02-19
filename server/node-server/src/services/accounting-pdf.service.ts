import type { Readable } from "stream";

type MonthCode =
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

type GeneralData = {
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

type MonthEntry = { dia: string; importe: string };
type MonthEntries = Record<MonthCode, MonthEntry[]>;

type TributosEntry = {
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

type PdfFonts = Record<
	string,
	{ normal: string; bold: string; italics: string; bolditalics: string }
>;

type PdfPrinterLike = {
	createPdfKitDocument: (docDefinition: unknown) => Readable & { end: () => void };
};

type PdfPrinterConstructor = new (fonts: PdfFonts) => PdfPrinterLike;

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

const getMonthTotal = (entries: MonthEntry[]): number =>
	entries.reduce((acc, curr) => acc + parseCurrency(curr.importe), 0);

const dayColumnWidth = 16;
const monthColumnWidth = 34;
const firstPageWidths = [60, 60, 125, 125, 95, 95, 55, 85] as const;
const firstPageTableWidth = 700;
const tributosMonths = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
] as const;

const normalizeMonth = (value: string): string =>
	value
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.trim();

const buildMonthTableBody = (title: string, entries: MonthEntries) => {
	const titleRow: unknown[] = [
		{
			colSpan: 24,
			text: title,
			bold: true,
			fontSize: 9,
			alignment: "center",
		},
		...Array.from({ length: 23 }, () => ({})),
	];

	const headerRow: { text: string; bold: boolean; fontSize: number; alignment: string }[] = [];
	monthCodes.forEach((month) => {
		headerRow.push({ text: "D", bold: true, fontSize: 6, alignment: "center" });
		headerRow.push({ text: month, bold: true, fontSize: 7, alignment: "center" });
	});

	const body: unknown[] = [titleRow, headerRow];
	for (let rowIdx = 0; rowIdx < 36; rowIdx++) {
		const row: unknown[] = [];
		monthCodes.forEach((month) => {
			row.push({
				text: entries[month]?.[rowIdx]?.dia || "",
				fontSize: 6,
				alignment: "center",
			});
			row.push({
				text: entries[month]?.[rowIdx]?.importe || "",
				fontSize: 7,
				alignment: "right",
			});
		});
		body.push(row);
	}

	const totalRow: unknown[] = [];
	monthCodes.forEach((month) => {
		totalRow.push({ text: "", fontSize: 6, alignment: "center" });
		totalRow.push({
			text: getMonthTotal(entries[month] ?? []).toFixed(2),
			fontSize: 7,
			alignment: "right",
			bold: true,
		});
	});
	body.push(totalRow);
	return body;
};

const buildMonthSection = (
	title: string,
	annualLabel: string,
	entries: MonthEntries,
) => {
	const annualTotal = monthCodes.reduce(
		(acc, month) => acc + getMonthTotal(entries[month] ?? []),
		0,
	);

	return {
		stack: [
			{
				table: {
					widths: monthCodes.flatMap(() => [dayColumnWidth, monthColumnWidth]),
					body: buildMonthTableBody(title, entries),
				},
				layout: {
					hLineWidth: (): number => 0.6,
					vLineWidth: (): number => 0.6,
					paddingTop: (): number => 2,
					paddingBottom: (): number => 2,
				},
			},
			{
				margin: [0, 8, 0, 0],
				columns: [
					{ width: "*", text: "" },
					{
						width: "auto",
						table: {
							widths: [170, 70],
							body: [
								[
									{ text: annualLabel, bold: true, fontSize: 9 },
									{ text: annualTotal.toFixed(2), alignment: "right", fontSize: 9 },
								],
							],
						},
						layout: {
							hLineWidth: (): number => 1,
							vLineWidth: (): number => 1,
							paddingTop: (): number => 4,
							paddingBottom: (): number => 4,
						},
					},
				],
			},
		],
	};
};

const getPdfPrinter = (): PdfPrinterLike => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const PdfPrinter = require("pdfmake") as PdfPrinterConstructor;

	const fonts: PdfFonts = {
		Helvetica: {
			normal: "Helvetica",
			bold: "Helvetica-Bold",
			italics: "Helvetica-Oblique",
			bolditalics: "Helvetica-BoldOblique",
		},
	};

	return new PdfPrinter(fonts);
};

export const buildTcpPdfBuffer = async (data: TcpDocumentData): Promise<Buffer> => {
	const printer = getPdfPrinter();
	const tributosByMonth = new Map(
		data.tributos.map((row) => [normalizeMonth(row.mes), row] as const),
	);
	const emptyTributo: TributosEntry = {
		mes: "",
		b: "",
		c: "",
		d: "",
		e: "",
		f: "",
		h: "",
		i: "",
		j: "",
		l: "",
		m: "",
		n: "",
		o: "",
		p: "",
	};

	const tributosRows = tributosMonths.map((month, index) => {
		const source =
			tributosByMonth.get(normalizeMonth(month)) ??
			data.tributos[index] ??
			emptyTributo;
		const g = parseCurrency(source.h) + parseCurrency(source.i);
		const k =
			parseCurrency(source.b) +
			parseCurrency(source.c) +
			parseCurrency(source.d) +
			parseCurrency(source.e) +
			parseCurrency(source.f) +
			g +
			parseCurrency(source.j);
		return {
			mes: month,
			b: source.b || "",
			c: source.c || "",
			d: source.d || "",
			e: source.e || "",
			f: source.f || "",
			g,
			h: source.h || "",
			i: source.i || "",
			j: source.j || "",
			k,
			l: source.l || "",
			m: source.m || "",
			n: source.n || "",
			o: source.o || "",
			p: source.p || "",
		};
	});

	const tributosTotals = tributosRows.reduce(
		(acc, row) => ({
			b: acc.b + parseCurrency(row.b),
			c: acc.c + parseCurrency(row.c),
			d: acc.d + parseCurrency(row.d),
			e: acc.e + parseCurrency(row.e),
			f: acc.f + parseCurrency(row.f),
			g: acc.g + row.g,
			h: acc.h + parseCurrency(row.h),
			i: acc.i + parseCurrency(row.i),
			j: acc.j + parseCurrency(row.j),
			k: acc.k + row.k,
			l: acc.l + parseCurrency(row.l),
			m: acc.m + parseCurrency(row.m),
			n: acc.n + parseCurrency(row.n),
			o: acc.o + parseCurrency(row.o),
			p: acc.p + parseCurrency(row.p),
		}),
		{
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
		},
	);

	const docDefinition = {
		pageSize: "A4",
		pageOrientation: "landscape",
		pageMargins: [10, 10, 10, 10],
		defaultStyle: {
			font: "Helvetica",
		},
		content: [
			{
				stack: [
					{
						margin: [0, 8, 0, 0],
						columns: [
							{ width: "*", text: "" },
							{
								width: "auto",
								table: {
									widths: firstPageWidths,
									body: [
										[
											{
												rowSpan: 2,
												colSpan: 2,
												stack: [
													{ text: "ONAT", bold: true, fontSize: 16, alignment: "center" },
													{
														text: "OFICINA NACIONAL DE\nADMINISTRACION TRIBUTARIA",
														fontSize: 6,
														alignment: "center",
													},
												],
												margin: [0, 8, 0, 0],
											},
											{},
											{
												rowSpan: 2,
												colSpan: 4,
												text: "REGISTRO DE INGRESOS Y GASTOS PARA EL TRABAJO POR CUENTA\nPROPIA",
												bold: true,
												fontSize: 11,
												alignment: "center",
												margin: [0, 10, 0, 0],
											},
											{},
											{},
											{},
											{ colSpan: 2, text: "Año", bold: true, fontSize: 10, alignment: "center" },
											{},
										],
										[
											{},
											{},
											{},
											{},
											{},
											{},
											{ colSpan: 2, text: data.generalData.anio || "", fontSize: 11, bold: true, alignment: "center" },
											{},
										],
										[
											{ colSpan: 6, text: "Nombre(s) y Apellidos del Contribuyente", fontSize: 9, alignment: "center" },
											{},
											{},
											{},
											{},
											{},
											{ colSpan: 2, text: "NIT", fontSize: 10, bold: true, alignment: "center" },
											{},
										],
										[
											{ colSpan: 6, text: data.generalData.nombre || "", fontSize: 10 },
											{},
											{},
											{},
											{},
											{},
											{ colSpan: 2, text: data.generalData.nit || "", fontSize: 10 },
											{},
										],
										[
											{
												colSpan: 8,
												text: "Domicilio fiscal: (lugar donde desarrolla la actividad): calle, No, apto, entre calles:",
												fontSize: 9,
											},
											{},
											{},
											{},
											{},
											{},
											{},
											{},
										],
										[
											{ colSpan: 8, text: data.generalData.fiscalCalle || "", fontSize: 10 },
											{},
											{},
											{},
											{},
											{},
											{},
											{},
										],
										[
											{ colSpan: 2, text: "Municipio:", fontSize: 10 },
											{},
											{ colSpan: 2, text: data.generalData.fiscalMunicipio || "", fontSize: 10 },
											{},
											{ colSpan: 2, text: "Provincia:", fontSize: 10 },
											{},
											{ colSpan: 2, text: data.generalData.fiscalProvincia || "", fontSize: 10 },
											{},
										],
										[
											{
												colSpan: 8,
												text: "Domicilio legal: (según Carnet de Identidad): calle, No, Apto, entre calles.",
												fontSize: 9,
											},
											{},
											{},
											{},
											{},
											{},
											{},
											{},
										],
										[
											{ colSpan: 8, text: data.generalData.legalCalle || "", fontSize: 10 },
											{},
											{},
											{},
											{},
											{},
											{},
											{},
										],
										[
											{ colSpan: 2, text: "Municipio:", fontSize: 10 },
											{},
											{ colSpan: 2, text: data.generalData.legalMunicipio || "", fontSize: 10 },
											{},
											{ colSpan: 2, text: "Provincia:", fontSize: 10 },
											{},
											{ colSpan: 2, text: data.generalData.legalProvincia || "", fontSize: 10 },
											{},
										],
										[
											{ text: "Actividad:", fontSize: 10 },
											{ colSpan: 5, text: data.generalData.actividad || "", fontSize: 10 },
											{},
											{},
											{},
											{},
											{ text: "Código:", fontSize: 10 },
											{ text: data.generalData.codigo || "", fontSize: 10 },
										],
									],
								},
								layout: {
									hLineWidth: (): number => 1,
									vLineWidth: (): number => 1,
									paddingTop: (): number => 4,
									paddingBottom: (): number => 4,
									paddingLeft: (): number => 3,
									paddingRight: (): number => 3,
								},
							},
							{ width: "*", text: "" },
						],
					},
					{
						margin: [0, 14, 0, 0],
						columns: [
							{ width: "*", text: "" },
							{
								width: firstPageTableWidth,
								columns: [
									{
										width: 220,
										table: {
											widths: [80, 70, 70],
											body: [
												[
													{ text: "D", alignment: "center", fontSize: 10 },
													{ text: "M", alignment: "center", fontSize: 10 },
													{ text: "A", alignment: "center", fontSize: 10 },
												],
												[
													{ text: data.generalData.firmaDia || "", alignment: "center", fontSize: 10 },
													{ text: data.generalData.firmaMes || "", alignment: "center", fontSize: 10 },
													{ text: data.generalData.firmaAnio || "", alignment: "center", fontSize: 10 },
												],
											],
										},
										layout: {
											hLineWidth: (): number => 1,
											vLineWidth: (): number => 1,
											paddingTop: (): number => 4,
											paddingBottom: (): number => 4,
										},
									},
									{ width: "*", text: "" },
								],
							},
							{ width: "*", text: "" },
						],
					},
				],
				pageBreak: "after",
			},
			{
				...buildMonthSection("INGRESOS", "Total de Ingresos Anuales", data.ingresos),
				pageBreak: "after",
			},
			{
				...buildMonthSection("GASTOS", "Total de Gastos Anuales", data.gastos),
				pageBreak: "after",
			},
			{
				stack: [
					{
						table: {
							widths: [64, ...Array(15).fill(44)],
							body: [
								[
									{
										colSpan: 16,
										text: "TRIBUTOS  Y OTROS GASTOS  ASOCIADOS A LA ACTIVIDAD",
										bold: true,
										alignment: "center",
										fontSize: 12,
									},
									...Array.from({ length: 15 }, () => ({})),
								],
								[
									{
										rowSpan: 3,
										text: "Mes",
										bold: true,
										alignment: "center",
										fontSize: 9,
									},
									{
										colSpan: 9,
										text: "TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA",
										bold: true,
										alignment: "center",
										fontSize: 10,
									},
									{},
									{},
									{},
									{},
									{},
									{},
									{},
									{},
									{
										rowSpan: 3,
										text: "Subtotal",
										bold: true,
										alignment: "center",
										fontSize: 9,
									},
									{
										colSpan: 4,
										text: "Otros Gastos deducibles de la base imponible",
										bold: true,
										alignment: "center",
										fontSize: 10,
									},
									{},
									{},
									{},
									{
										rowSpan: 3,
										text: "Cuota Mensual (5 %)051012",
										bold: true,
										alignment: "center",
										fontSize: 8,
									},
								],
								[
									{},
									{ rowSpan: 2, text: "Impuesto sobre Ventas o Servicios (10%) 011402", fontSize: 7, bold: true, alignment: "center" },
									{ rowSpan: 2, text: "Impuesto por la Utilización de la Fuerza de Trabajo 061032", fontSize: 7, bold: true, alignment: "center" },
									{ rowSpan: 2, text: "Impuesto sobre Documentos y sellos 073012", fontSize: 7, bold: true, alignment: "center" },
									{ rowSpan: 2, text: "Tasa por la Radicación de Anuncios. Cartel 090012", fontSize: 7, bold: true, alignment: "center" },
									{ rowSpan: 2, text: "Contribución Especial a la Seguridad Social (20%) 082013", fontSize: 7, bold: true, alignment: "center" },
									{ colSpan: 3, text: "Contribución a la Seguridad Social (14%) 081013", fontSize: 7, bold: true, alignment: "center" },
									{},
									{},
									{ rowSpan: 2, text: "Otros", fontSize: 8, bold: true, alignment: "center" },
									{},
									{ rowSpan: 2, text: "Contribución para la Restauración y Preservación de las Zonas donde Desarrolla su Activ.", fontSize: 7, bold: true, alignment: "center" },
									{ rowSpan: 2, text: "Pago por arrendamiento de bienes estatales autorizadas", fontSize: 7, bold: true, alignment: "center" },
									{ rowSpan: 2, text: "Importes exonerados por arrendam. por asumir gastos de reparaciones", fontSize: 7, bold: true, alignment: "center" },
									{ rowSpan: 2, text: "Otros Gastos autorizados MFP", fontSize: 7, bold: true, alignment: "center" },
									{},
								],
								[
									{},
									{},
									{},
									{},
									{},
									{},
									{ text: "Total", fontSize: 8, bold: true, alignment: "center" },
									{ text: "12.5%", fontSize: 8, bold: true, alignment: "center" },
									{ text: "1.5%", fontSize: 8, bold: true, alignment: "center" },
									{},
									{},
									{},
									{},
									{},
									{},
									{},
								],
								[
									{ text: "", fontSize: 8 },
									{ text: "-1", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-2", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-3", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-4", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-5", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-6", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-7", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-8", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-9", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-10", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-11", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-12", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-13", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-14", fontSize: 9, bold: true, alignment: "center" },
									{ text: "-15", fontSize: 9, bold: true, alignment: "center" },
								],
								...tributosRows.map((row) => [
									{ text: row.mes, fontSize: 9 },
									{ text: row.b, fontSize: 8, alignment: "right" },
									{ text: row.c, fontSize: 8, alignment: "right" },
									{ text: row.d, fontSize: 8, alignment: "right" },
									{ text: row.e, fontSize: 8, alignment: "right" },
									{ text: row.f, fontSize: 8, alignment: "right" },
									{ text: row.g ? row.g.toFixed(2) : "", fontSize: 8, alignment: "right" },
									{ text: row.h, fontSize: 8, alignment: "right" },
									{ text: row.i, fontSize: 8, alignment: "right" },
									{ text: row.j, fontSize: 8, alignment: "right" },
									{ text: row.k ? row.k.toFixed(2) : "", fontSize: 8, alignment: "right" },
									{ text: row.l, fontSize: 8, alignment: "right" },
									{ text: row.m, fontSize: 8, alignment: "right" },
									{ text: row.n, fontSize: 8, alignment: "right" },
									{ text: row.o, fontSize: 8, alignment: "right" },
									{ text: row.p, fontSize: 8, alignment: "right" },
								]),
								[
									{ text: "Total pagado", bold: true, fontSize: 10 },
									{ text: tributosTotals.b.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.c.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.d.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.e.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.f.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.g.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.h.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.i.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.j.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.k.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.l.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.m.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.n.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.o.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
									{ text: tributosTotals.p.toFixed(2), bold: true, fontSize: 8, alignment: "right" },
								],
							],
						},
						layout: {
							hLineWidth: (): number => 1,
							vLineWidth: (): number => 1,
							paddingTop: (): number => 2,
							paddingBottom: (): number => 2,
							paddingLeft: (): number => 2,
							paddingRight: (): number => 2,
						},
					},
				],
			},
		],
	};

	const pdfDoc = printer.createPdfKitDocument(docDefinition);
	const chunks: Buffer[] = [];

	return await new Promise<Buffer>((resolve, reject) => {
		pdfDoc.on("data", (chunk: Buffer | Uint8Array) => {
			if (Buffer.isBuffer(chunk)) {
				chunks.push(chunk);
				return;
			}
			chunks.push(Buffer.from(chunk));
		});
		pdfDoc.on("end", () => {
			resolve(Buffer.concat(chunks));
		});
		pdfDoc.on("error", (error: Error) => {
			reject(error);
		});
		pdfDoc.end();
	});
};
