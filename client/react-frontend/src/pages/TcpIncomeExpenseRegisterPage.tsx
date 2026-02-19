import { ArrowLeft, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { type ChangeEvent, type Dispatch, type FC, type SetStateAction, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import useExportTable from "@/hooks/useExportTable";
import api from "@/lib/api";
import { generateTcpPdf } from "@/lib/pdfService";
import { useToast } from "@/hooks/use-toast";

type SheetTab = "GENERALES" | "INGRESOS" | "GASTOS" | "TRIBUTOS";
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
];

const instructions = [
	"INSTRUCCIONES PARA LA CONSERVACIÓN DEL REGISTRO Y ANOTACIÓN DE LAS OPERACIONES",
	"Objetivo: Facilitar el registro de las operaciones a los contribuyentes; proporcionando los elementos para llenar la Declaración Jurada del impuesto sobre ingresos personales. Se registra en CUP",
	"- El Registro debe conservarse limpio y en buen estado. Cuando presenta deterioro, que impide la comprobación de la actividad y de los datos consignados en este, el contribuyente debe sustituirlo por otro.",
	"- El Registro debe mantenerse actualizado, se llena a tinta y en letra de molde legible. Puede llevarse en formato digital.",
	"- El Registro se conserva por cinco (5) años, contados a partir del cierre del año fiscal en que se registraron operaciones.",
	"- En cada una de las columnas señaladas con la letra D se anota el día del mes al que corresponde el ingreso o el gasto.",
	"- Los ingresos y gastos que se cobran o pagan en MLC u otra divisa extranjera convertible en Cuba, se anotan en CUP a la tasa de cambio vigente del BCC.",
	"- En las columnas de los meses, se anota el importe del ingreso o gasto del día que corresponda.",
	"- Al finalizar cada mes, se pasa raya anulando las filas no utilizadas y se suman los ingresos y gastos en la fila Total.",
	"TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA y GASTOS DEDUCIBLES DIRECTAMENTE DE LA BASE IMPONIBLE:",
	"- En la fila de cada mes se anota el importe pagado en ese mes.",
	"- En la columna 6 el total es la suma de las columnas 7 y 8.",
	"- En la columna 10 se suman las columnas 1 a la 6 y la 9.",
	"- Al finalizar el año se suman verticalmente todas las columnas y el resultado se anota en la fila Total pagado.",
];

const createMonthRows = (): MonthEntry[] =>
	Array.from({ length: 36 }, () => ({ dia: "", importe: "" }));

const createMonthEntries = (): MonthEntries => ({
	ENE: createMonthRows(),
	FEB: createMonthRows(),
	MAR: createMonthRows(),
	ABR: createMonthRows(),
	MAY: createMonthRows(),
	JUN: createMonthRows(),
	JUL: createMonthRows(),
	AGO: createMonthRows(),
	SEP: createMonthRows(),
	OCT: createMonthRows(),
	NOV: createMonthRows(),
	DIC: createMonthRows(),
});

const parseCurrency = (value: string): number => {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};

const getMonthTotal = (entries: MonthEntry[]): number =>
	entries.reduce((acc, curr) => acc + parseCurrency(curr.importe), 0);

const DAY_COLUMN_WIDTH_PX = 34;
const MONTH_COLUMN_WIDTH_PX = 58;

const monthNameToCode: Record<string, MonthCode> = {
	Enero: "ENE",
	Febrero: "FEB",
	Marzo: "MAR",
	Abril: "ABR",
	Mayo: "MAY",
	Junio: "JUN",
	Julio: "JUL",
	Agosto: "AGO",
	Septiembre: "SEP",
	Octubre: "OCT",
	Noviembre: "NOV",
	Diciembre: "DIC",
};

type TcpDocumentPayload = {
	generalData: GeneralData;
	ingresos: MonthEntries;
	gastos: MonthEntries;
	tributos: TributosEntry[];
};

const TcpIncomeExpenseRegisterPage: FC = () => {
	const { documentId } = useParams<{ documentId?: string }>();
	const { toast } = useToast();
	const [isSaving, setIsSaving] = useState(false);
	const [activeSheet, setActiveSheet] = useState<SheetTab>("GENERALES");
	const [pageSize, setPageSize] = useState<"A4" | "Carta">("A4");
	const [generalData, setGeneralData] = useState<GeneralData>({
		anio: "",
		nombre: "",
		nit: "",
		fiscalCalle: "",
		fiscalMunicipio: "",
		fiscalProvincia: "",
		legalCalle: "",
		legalMunicipio: "",
		legalProvincia: "",
		actividad: "",
		codigo: "",
		firmaDia: "",
		firmaMes: "",
		firmaAnio: "",
	});
	const [ingresos, setIngresos] = useState<MonthEntries>(createMonthEntries());
	const [gastos, setGastos] = useState<MonthEntries>(createMonthEntries());
	const [tributos, setTributos] = useState<TributosEntry[]>(
		tributosMonths.map((mes) => ({
			mes,
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
		})),
	);
	const [quickForm, setQuickForm] = useState({
		anio: "",
		mes: "Enero",
		dia: "",
		importe: "",
	});
	const { exportToXlsx } = useExportTable();

	useEffect(() => {
		if (!documentId) return;

		const loadDocument = async () => {
			try {
				const { data } = await api.get<{ payload?: TcpDocumentPayload }>(
					`/api/accounting-documents/${documentId}`,
				);
				if (!data.payload) return;

				setGeneralData(data.payload.generalData ?? {
					anio: "",
					nombre: "",
					nit: "",
					fiscalCalle: "",
					fiscalMunicipio: "",
					fiscalProvincia: "",
					legalCalle: "",
					legalMunicipio: "",
					legalProvincia: "",
					actividad: "",
					codigo: "",
					firmaDia: "",
					firmaMes: "",
					firmaAnio: "",
				});
				setIngresos(data.payload.ingresos ?? createMonthEntries());
				setGastos(data.payload.gastos ?? createMonthEntries());
				setTributos(data.payload.tributos ?? tributosMonths.map((mes) => ({
					mes,
					b: "", c: "", d: "", e: "", f: "", h: "", i: "", j: "", l: "", m: "", n: "", o: "", p: "",
				})));
			} catch {
				toast({
					title: "Error",
					description: "No se pudo cargar el documento contable",
					variant: "destructive",
				});
			}
		};

		void loadDocument();
	}, [documentId, toast]);

	const handleSaveDocument = async () => {
		if (!documentId) return;
		setIsSaving(true);
		try {
			const payload: TcpDocumentPayload = {
				generalData,
				ingresos,
				gastos,
				tributos,
			};
			await api.put(`/api/accounting-documents/${documentId}`, { payload });
			toast({ title: "Guardado", description: "Documento contable guardado" });
		} catch {
			toast({
				title: "Error",
				description: "No se pudo guardar el documento",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleGeneratePdf = () => {
		generateTcpPdf({
			generalData,
			ingresos,
			gastos,
			tributos,
		});
	};

	const monthTotalsIngresos = useMemo(
		() => monthCodes.map((month) => getMonthTotal(ingresos[month])),
		[ingresos],
	);
	const monthTotalsGastos = useMemo(
		() => monthCodes.map((month) => getMonthTotal(gastos[month])),
		[gastos],
	);

	const annualIngresos = monthTotalsIngresos.reduce((acc, value) => acc + value, 0);
	const annualGastos = monthTotalsGastos.reduce((acc, value) => acc + value, 0);

	const handleGeneralChange = (field: keyof GeneralData, value: string) => {
		setGeneralData((prev) => ({ ...prev, [field]: value }));
	};

	const handleMonthCellChange = (
		setter: Dispatch<SetStateAction<MonthEntries>>,
		month: MonthCode,
		rowIndex: number,
		field: keyof MonthEntry,
		value: string,
	) => {
		setter((prev) => {
			const nextRows = [...prev[month]];
			nextRows[rowIndex] = { ...nextRows[rowIndex], [field]: value };
			return { ...prev, [month]: nextRows };
		});
	};

	const handleQuickInsert = () => {
		const monthCode = monthNameToCode[quickForm.mes];
		if (!monthCode || !quickForm.importe || !quickForm.dia) return;

		const setter = activeSheet === "INGRESOS" ? setIngresos : setGastos;
		setter((prev) => {
			const rows = [...prev[monthCode]];
			const firstEmptyIndex = rows.findIndex((row) => !row.importe);
			const targetIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0;
			rows[targetIndex] = {
				dia: quickForm.dia,
				importe: quickForm.importe,
			};
			return { ...prev, [monthCode]: rows };
		});

		if (quickForm.anio) {
			handleGeneralChange("anio", quickForm.anio);
		}
		setQuickForm((prev) => ({ ...prev, dia: "", importe: "" }));
	};

	const handleTributoChange = (rowIndex: number, field: keyof TributosEntry, value: string) => {
		setTributos((prev) => {
			const next = [...prev];
			next[rowIndex] = { ...next[rowIndex], [field]: value };
			return next;
		});
	};

	const tributosRows = useMemo(
		() =>
			tributos.map((row) => {
				const g = parseCurrency(row.h) + parseCurrency(row.i);
				const k =
					parseCurrency(row.b) +
					parseCurrency(row.c) +
					parseCurrency(row.d) +
					parseCurrency(row.e) +
					parseCurrency(row.f) +
					g +
					parseCurrency(row.j);

				return {
					...row,
					g,
					k,
				};
			}),
		[tributos],
	);

	const tributosTotals = useMemo(
		() => ({
			b: tributosRows.reduce((acc, row) => acc + parseCurrency(row.b), 0),
			c: tributosRows.reduce((acc, row) => acc + parseCurrency(row.c), 0),
			d: tributosRows.reduce((acc, row) => acc + parseCurrency(row.d), 0),
			e: tributosRows.reduce((acc, row) => acc + parseCurrency(row.e), 0),
			f: tributosRows.reduce((acc, row) => acc + parseCurrency(row.f), 0),
			g: tributosRows.reduce((acc, row) => acc + row.g, 0),
			h: tributosRows.reduce((acc, row) => acc + parseCurrency(row.h), 0),
			i: tributosRows.reduce((acc, row) => acc + parseCurrency(row.i), 0),
			j: tributosRows.reduce((acc, row) => acc + parseCurrency(row.j), 0),
			k: tributosRows.reduce((acc, row) => acc + row.k, 0),
			l: tributosRows.reduce((acc, row) => acc + parseCurrency(row.l), 0),
			m: tributosRows.reduce((acc, row) => acc + parseCurrency(row.m), 0),
			n: tributosRows.reduce((acc, row) => acc + parseCurrency(row.n), 0),
			o: tributosRows.reduce((acc, row) => acc + parseCurrency(row.o), 0),
			p: tributosRows.reduce((acc, row) => acc + parseCurrency(row.p), 0),
		}),
		[tributosRows],
	);

	const renderMonthSheet = (
		title: "INGRESOS" | "GASTOS",
		entries: MonthEntries,
		totals: number[],
		annual: number,
		setter: Dispatch<SetStateAction<MonthEntries>>,
	) => (
		<table
			id="myTable"
			className="w-full min-w-[1104px] border-collapse table-fixed"
		>
			<colgroup>
				{monthCodes.flatMap((month) => [
					<col key={`${month}-day-col`} style={{ width: `${DAY_COLUMN_WIDTH_PX}px` }} />,
					<col key={`${month}-month-col`} style={{ width: `${MONTH_COLUMN_WIDTH_PX}px` }} />,
				])}
			</colgroup>
			<thead>
				<tr>
					<th colSpan={24} className="border py-1 px-0 text-center bg-slate-200 dark:bg-slate-700 font-bold text-[10px]">
						{title}
					</th>
				</tr>
				<tr>
					{monthCodes.map((month, idx) => (
						<>
							<th key={`${month}-day`} className="border py-0.5 px-0 bg-slate-100 dark:bg-slate-800 text-[10px]">D</th>
							<th key={`${month}-amount`} className="border py-0.5 px-0 bg-slate-100 dark:bg-slate-800 text-[10px]">{monthCodes[idx]}</th>
						</>
					))}
				</tr>
			</thead>
			<tbody>
				{Array.from({ length: 36 }, (_, rowIndex) => (
					<tr key={`row-${rowIndex + 1}`}>
						{monthCodes.map((month) => (
							<>
								<td key={`${month}-day-${rowIndex + 1}`} className="border p-0">
									<Input
										value={entries[month][rowIndex].dia}
										onChange={(event: ChangeEvent<HTMLInputElement>) =>
											handleMonthCellChange(setter, month, rowIndex, "dia", event.target.value)
										}
										className="h-7 rounded-none border-0 px-0 py-0 text-center text-[12px] leading-none"
									/>
								</td>
								<td key={`${month}-amount-${rowIndex + 1}`} className="border p-0">
									<Input
										value={entries[month][rowIndex].importe}
										onChange={(event: ChangeEvent<HTMLInputElement>) =>
											handleMonthCellChange(setter, month, rowIndex, "importe", event.target.value)
										}
										className="h-7 rounded-none border-0 px-0 py-0 text-right text-[12px] leading-none"
									/>
								</td>
							</>
						))}
					</tr>
				))}
				<tr>
					<td className="border p-2 font-bold text-[12px]">Total</td>
					{monthCodes.map((month, idx) => (
						<>
							<td key={`${month}-spacer`} className="border" />
							<td key={`${month}-total`} className="border p-2 text-right font-semibold text-[12px]">
								{totals[idx].toFixed(2)}
							</td>
						</>
					))}
				</tr>
				<tr>
					<td colSpan={18} className="border p-2 text-right font-semibold text-[12px]">
						Total de {title === "INGRESOS" ? "Ingresos" : "Gastos"} Anuales
					</td>
					<td colSpan={6} className="border p-2 text-right font-bold text-[12px]">
						{annual.toFixed(2)}
					</td>
				</tr>
			</tbody>
		</table>
	);

	const sheetPreview = () => {
		if (activeSheet === "GENERALES") {
			return (
				<table id="myTable" className="w-full min-w-[900px] border-collapse text-xs md:text-sm">
					<tbody>
						<tr>
							<td rowSpan={2} className="border p-2" />
							<td colSpan={5} rowSpan={2} className="border p-2 text-center font-bold">
								REGISTRO DE INGRESOS Y GASTOS PARA EL TRABAJO POR CUENTA PROPIA
							</td>
							<td colSpan={2} className="border p-2 text-center">Año</td>
						</tr>
						<tr>
							<td colSpan={2} className="border p-0">
								<Input value={generalData.anio} onChange={(e) => handleGeneralChange("anio", e.target.value)} className="h-8 border-0 rounded-none text-center" />
							</td>
						</tr>
						<tr><td colSpan={6} className="border p-2">Nombre(s) y Apellidos del Contribuyente</td><td colSpan={2} className="border p-2">NIT</td></tr>
						<tr><td colSpan={6} className="border p-0"><Input value={generalData.nombre} onChange={(e) => handleGeneralChange("nombre", e.target.value)} className="h-8 border-0 rounded-none" /></td><td colSpan={2} className="border p-0"><Input value={generalData.nit} onChange={(e) => handleGeneralChange("nit", e.target.value)} className="h-8 border-0 rounded-none" /></td></tr>
						<tr><td colSpan={8} className="border p-2">Domicilio fiscal: (lugar donde desarrolla la actividad): calle, No, apto, entre calles:</td></tr>
						<tr><td colSpan={8} className="border p-0"><Input value={generalData.fiscalCalle} onChange={(e) => handleGeneralChange("fiscalCalle", e.target.value)} className="h-8 border-0 rounded-none" /></td></tr>
						<tr><td colSpan={2} className="border p-2">Municipio:</td><td colSpan={2} className="border p-0"><Input value={generalData.fiscalMunicipio} onChange={(e) => handleGeneralChange("fiscalMunicipio", e.target.value)} className="h-8 border-0 rounded-none" /></td><td colSpan={2} className="border p-2">Provincia:</td><td colSpan={2} className="border p-0"><Input value={generalData.fiscalProvincia} onChange={(e) => handleGeneralChange("fiscalProvincia", e.target.value)} className="h-8 border-0 rounded-none" /></td></tr>
						<tr><td colSpan={8} className="border p-2">Domicilio legal: (según Carnet de Identidad): calle, No, Apto, entre calles.</td></tr>
						<tr><td colSpan={8} className="border p-0"><Input value={generalData.legalCalle} onChange={(e) => handleGeneralChange("legalCalle", e.target.value)} className="h-8 border-0 rounded-none" /></td></tr>
						<tr><td colSpan={2} className="border p-2">Municipio:</td><td colSpan={2} className="border p-0"><Input value={generalData.legalMunicipio} onChange={(e) => handleGeneralChange("legalMunicipio", e.target.value)} className="h-8 border-0 rounded-none" /></td><td colSpan={2} className="border p-2">Provincia:</td><td colSpan={2} className="border p-0"><Input value={generalData.legalProvincia} onChange={(e) => handleGeneralChange("legalProvincia", e.target.value)} className="h-8 border-0 rounded-none" /></td></tr>
						<tr><td className="border p-2">Actividad:</td><td colSpan={5} className="border p-0"><Input value={generalData.actividad} onChange={(e) => handleGeneralChange("actividad", e.target.value)} className="h-8 border-0 rounded-none" /></td><td className="border p-2">Código:</td><td className="border p-0"><Input value={generalData.codigo} onChange={(e) => handleGeneralChange("codigo", e.target.value)} className="h-8 border-0 rounded-none" /></td></tr>
						<tr><td className="border p-2">D</td><td className="border p-2">M</td><td className="border p-2">A</td><td className="border p-0"><Input value={generalData.firmaDia} onChange={(e) => handleGeneralChange("firmaDia", e.target.value)} className="h-8 border-0 rounded-none" /></td><td className="border p-0"><Input value={generalData.firmaMes} onChange={(e) => handleGeneralChange("firmaMes", e.target.value)} className="h-8 border-0 rounded-none" /></td><td className="border p-0"><Input value={generalData.firmaAnio} onChange={(e) => handleGeneralChange("firmaAnio", e.target.value)} className="h-8 border-0 rounded-none" /></td><td colSpan={2} className="border p-2 text-center">Firma del contribuyente</td></tr>
					</tbody>
				</table>
			);
		}

		if (activeSheet === "INGRESOS") {
			return renderMonthSheet("INGRESOS", ingresos, monthTotalsIngresos, annualIngresos, setIngresos);
		}

		if (activeSheet === "GASTOS") {
			return renderMonthSheet("GASTOS", gastos, monthTotalsGastos, annualGastos, setGastos);
		}

		return (
			<table id="myTable" className="w-full min-w-[1300px] border-collapse text-xs">
				<thead>
					<tr><th colSpan={16} className="border p-2 bg-slate-200 dark:bg-slate-700">TRIBUTOS Y OTROS GASTOS ASOCIADOS A LA ACTIVIDAD</th></tr>
					<tr><th rowSpan={3} className="border p-2">Mes</th><th colSpan={9} className="border p-2">TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA</th><th rowSpan={2} className="border p-2">Subtotal</th><th colSpan={4} className="border p-2">Otros gastos deducibles</th><th rowSpan={2} className="border p-2">Cuota Mensual (5%)</th></tr>
					<tr><th rowSpan={2} className="border p-2">1</th><th rowSpan={2} className="border p-2">2</th><th rowSpan={2} className="border p-2">3</th><th rowSpan={2} className="border p-2">4</th><th rowSpan={2} className="border p-2">5</th><th colSpan={3} className="border p-2">6</th><th rowSpan={2} className="border p-2">9</th><th rowSpan={2} className="border p-2">11</th><th rowSpan={2} className="border p-2">12</th><th rowSpan={2} className="border p-2">13</th><th rowSpan={2} className="border p-2">14</th></tr>
					<tr><th className="border p-2">Total</th><th className="border p-2">0.125</th><th className="border p-2">0.015</th><th className="border p-2">15</th></tr>
				</thead>
				<tbody>
					{tributosRows.map((row, idx) => (
						<tr key={row.mes}>
							<td className="border p-2">{row.mes}</td>
							{(["b", "c", "d", "e", "f", "h", "i", "j", "l", "m", "n", "o", "p"] as const).map((field) => (
								<td key={`${row.mes}-${field}`} className="border p-0">
									<Input value={row[field]} onChange={(e) => handleTributoChange(idx, field, e.target.value)} className="h-8 border-0 rounded-none text-right" />
								</td>
							))}
							<td className="border p-2 text-right font-semibold text-[12px]">{row.g.toFixed(2)}</td>
							<td className="border p-2 text-right font-semibold text-[12px]">{row.k.toFixed(2)}</td>
						</tr>
					))}
					<tr className="font-bold bg-slate-100 dark:bg-slate-800"><td className="border p-2">Total pagado</td><td className="border p-2 text-right">{tributosTotals.b.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.c.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.d.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.e.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.f.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.h.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.i.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.j.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.l.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.m.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.n.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.o.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.p.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.g.toFixed(2)}</td><td className="border p-2 text-right">{tributosTotals.k.toFixed(2)}</td></tr>
					{instructions.map((text, idx) => (
						<tr key={`instruction-${idx + 1}`}>
							<td colSpan={16} className="border p-2 text-left whitespace-pre-wrap">{text}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	};

	return (
		<div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-6">
			<style>{`
				@media print {
					@page { size: landscape; margin: 10mm; }
					body * { visibility: hidden !important; }
					#print-area, #print-area * { visibility: visible !important; }
					#print-area {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
						background: white;
					}
				}
			`}</style>
			<div className="mx-auto max-w-[1600px]">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Link to="/dashboard">
							<Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
						</Link>
						<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Registro de Ingresos y Gastos TCP</h1>
					</div>
					<div className="flex items-center gap-2">
						<Select value={pageSize} onValueChange={(value) => setPageSize(value as "A4" | "Carta")}>
							<SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
							<SelectContent><SelectItem value="A4">A4</SelectItem><SelectItem value="Carta">Carta</SelectItem></SelectContent>
						</Select>
						{documentId && (
								<Button variant="outline" onClick={handleSaveDocument} disabled={isSaving}>
									{isSaving ? "Guardando..." : "Guardar"}
								</Button>
							)}
							<Button variant="outline" onClick={exportToXlsx}><FileSpreadsheet className="w-4 h-4 mr-1" />Exportar Excel</Button>
							<Button variant="outline" onClick={handleGeneratePdf}><FileText className="w-4 h-4 mr-1" />Exportar PDF</Button>
						<Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Imprimir</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
					<Card>
						<CardHeader className="pb-2"><CardTitle className="text-sm">Hojas</CardTitle></CardHeader>
						<CardContent className="flex flex-col gap-2">
							{(["GENERALES", "INGRESOS", "GASTOS", "TRIBUTOS"] as SheetTab[]).map((sheet) => (
								<Button key={sheet} variant={activeSheet === sheet ? "default" : "outline"} className="justify-start" onClick={() => setActiveSheet(sheet)}>{sheet}</Button>
							))}
						</CardContent>
					</Card>

					<div className="space-y-4">
						{(activeSheet === "INGRESOS" || activeSheet === "GASTOS") && (
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Formulario rápido</CardTitle>
								</CardHeader>
								<CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
									<div>
										<Label>Año</Label>
										<Input
											value={quickForm.anio}
											onChange={(event) =>
												setQuickForm((prev) => ({ ...prev, anio: event.target.value }))
											}
										/>
									</div>
									<div>
										<Label>Mes</Label>
										<Select
											value={quickForm.mes}
											onValueChange={(value) =>
												setQuickForm((prev) => ({ ...prev, mes: value }))
											}
										>
											<SelectTrigger><SelectValue /></SelectTrigger>
											<SelectContent>
												{tributosMonths.map((month) => (
													<SelectItem key={month} value={month}>{month}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label>Día</Label>
										<Input
											value={quickForm.dia}
											onChange={(event) =>
												setQuickForm((prev) => ({ ...prev, dia: event.target.value }))
											}
										/>
									</div>
									<div>
										<Label>{activeSheet === "INGRESOS" ? "Ingreso" : "Gasto"}</Label>
										<Input
											value={quickForm.importe}
											onChange={(event) =>
												setQuickForm((prev) => ({ ...prev, importe: event.target.value }))
											}
										/>
									</div>
									<div className="flex items-end">
										<Button className="w-full" onClick={handleQuickInsert}>
											Insertar dato
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						<Card id="print-area">
							<CardHeader className="pb-2"><CardTitle className="text-sm">Vista previa imprimible ({pageSize})</CardTitle></CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<div className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded shadow p-2 min-w-[1104px]">
										{sheetPreview()}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TcpIncomeExpenseRegisterPage;
