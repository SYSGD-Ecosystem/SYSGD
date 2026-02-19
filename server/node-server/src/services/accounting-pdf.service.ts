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
const monthColumnWidth = 52;

const buildMonthRows = (entries: MonthEntries) => {
	const headerRow: { text: string; bold: boolean; fontSize: number; alignment: string }[] = [];
	monthCodes.forEach((month) => {
		headerRow.push({ text: "D", bold: true, fontSize: 6, alignment: "center" });
		headerRow.push({ text: month, bold: true, fontSize: 7, alignment: "center" });
	});

	const body: unknown[] = [headerRow];
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
						text: "REGISTRO DE INGRESOS Y GASTOS PARA EL TRABAJO POR CUENTA PROPIA",
						fontSize: 12,
						bold: true,
						alignment: "center",
						margin: [0, 0, 0, 8],
					},
					{
						table: {
							widths: [110, "*", 80, 90],
							body: [
								[
									{ text: "Nombre y Apellidos", bold: true },
									{ text: data.generalData.nombre || "" },
									{ text: "Año", bold: true },
									{ text: data.generalData.anio || "" },
								],
								[
									{ text: "NIT", bold: true },
									{ text: data.generalData.nit || "" },
									{ text: "Código", bold: true },
									{ text: data.generalData.codigo || "" },
								],
								[
									{ text: "Actividad", bold: true },
									{ text: data.generalData.actividad || "" },
									{ text: "Municipio fiscal", bold: true },
									{ text: data.generalData.fiscalMunicipio || "" },
								],
								[
									{ text: "Provincia fiscal", bold: true },
									{ text: data.generalData.fiscalProvincia || "" },
									{ text: "Municipio legal", bold: true },
									{ text: data.generalData.legalMunicipio || "" },
								],
								[
									{ text: "Provincia legal", bold: true },
									{ text: data.generalData.legalProvincia || "" },
									{ text: "Firma (D/M/A)", bold: true },
									{
										text: `${data.generalData.firmaDia || ""}/${data.generalData.firmaMes || ""}/${data.generalData.firmaAnio || ""}`,
									},
								],
								[
									{ text: "Domicilio fiscal", bold: true },
									{ text: data.generalData.fiscalCalle || "", colSpan: 3 },
									{},
									{},
								],
								[
									{ text: "Domicilio legal", bold: true },
									{ text: data.generalData.legalCalle || "", colSpan: 3 },
									{},
									{},
								],
							],
						},
					},
				],
				pageBreak: "after",
			},
			{
				stack: [
					{
						text: "INGRESOS",
						fontSize: 11,
						bold: true,
						alignment: "center",
						margin: [0, 0, 0, 5],
					},
					{
						table: {
							widths: monthCodes.flatMap(() => [dayColumnWidth, monthColumnWidth]),
							body: buildMonthRows(data.ingresos),
						},
						layout: {
							hLineWidth: (): number => 0.3,
							vLineWidth: (): number => 0.3,
						},
					},
				],
				pageBreak: "after",
			},
			{
				stack: [
					{
						text: "GASTOS",
						fontSize: 11,
						bold: true,
						alignment: "center",
						margin: [0, 0, 0, 5],
					},
					{
						table: {
							widths: monthCodes.flatMap(() => [dayColumnWidth, monthColumnWidth]),
							body: buildMonthRows(data.gastos),
						},
						layout: {
							hLineWidth: (): number => 0.3,
							vLineWidth: (): number => 0.3,
						},
					},
				],
				pageBreak: "after",
			},
			{
				stack: [
					{
						text: "TRIBUTOS Y OTROS GASTOS ASOCIADOS A LA ACTIVIDAD",
						fontSize: 11,
						bold: true,
						alignment: "center",
						margin: [0, 0, 0, 5],
					},
					{
						table: {
							widths: [40, 25, 25, 25, 25, 25, 30, 30, 30, 30, 35, 30, 30, 30, 30, 35],
							body: [
								[
									"Mes",
									"1",
									"2",
									"3",
									"4",
									"5",
									"6",
									"7",
									"8",
									"9",
									"10",
									"11",
									"12",
									"13",
									"14",
									"15",
								],
								...data.tributos.map((row) => {
									const g = parseCurrency(row.h) + parseCurrency(row.i);
									const k =
										parseCurrency(row.b) +
										parseCurrency(row.c) +
										parseCurrency(row.d) +
										parseCurrency(row.e) +
										parseCurrency(row.f) +
										g +
										parseCurrency(row.j);
									return [
										row.mes || "",
										row.b || "",
										row.c || "",
										row.d || "",
										row.e || "",
										row.f || "",
										g.toFixed(2),
										row.h || "",
										row.i || "",
										row.j || "",
										k.toFixed(2),
										row.l || "",
										row.m || "",
										row.n || "",
										row.o || "",
										row.p || "",
									];
								}),
							],
						},
						layout: {
							hLineWidth: (): number => 0.3,
							vLineWidth: (): number => 0.3,
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
