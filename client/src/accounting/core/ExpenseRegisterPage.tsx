import { type FC, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import useExportTable from "@/hooks/useExportTable";
import useBillingData from "@/hooks/connection/useBillingData";
import { generateTcpPdf } from "@/lib/pdfService";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

import type { SheetTab, GeneralData, TributosEntry } from "./types";
import { MONTH_CODES } from "./utils/constants";
import { getMonthTotal } from "./utils/helpers";
import { useTcpDocument } from "./hooks/useTcpDocument";

import { Toolbar } from "./components/Toolbar";
import { SheetTabBar } from "./components/SheetTabBar";
import { QuickInsertForm } from "./components/QuickInsertForm";
import { GeneralesSheet } from "./components/GeneralesSheet";
import { MonthSheet } from "./components/MonthSheet";
import { TributosSheet } from "./components/TributosSheet";

const ExpenseRegisterPage: FC = () => {
	const { documentId } = useParams<{ documentId?: string }>();
	const { toast } = useToast();
	const { billing, loading: billingLoading } = useBillingData();
	const { exportToXlsx } = useExportTable();

	const [activeSheet, setActiveSheet] = useState<SheetTab>("GENERALES");
	const [pageSize, setPageSize] = useState<"A4" | "Carta">("A4");

	const {
		generalData,
		setGeneralData,
		ingresos,
		setIngresos,
		gastos,
		setGastos,
		tributos,
		setTributos,
		isSaving,
		save,
		payload,
	} = useTcpDocument(documentId);

	// ── Derived totals ─────────────────────────────────────────────────────────
	const monthTotalsIngresos = useMemo(
		() => MONTH_CODES.map((m) => getMonthTotal(ingresos[m])),
		[ingresos],
	);
	const monthTotalsGastos = useMemo(
		() => MONTH_CODES.map((m) => getMonthTotal(gastos[m])),
		[gastos],
	);
	const annualIngresos = monthTotalsIngresos.reduce((a, v) => a + v, 0);
	const annualGastos = monthTotalsGastos.reduce((a, v) => a + v, 0);

	// ── Handlers ───────────────────────────────────────────────────────────────
	const handleGeneralChange = (field: keyof GeneralData, value: string) =>
		setGeneralData((prev) => ({ ...prev, [field]: value }));

	const handleTributoChange = (
		idx: number,
		field: keyof TributosEntry,
		value: string,
	) =>
		setTributos((prev) => {
			const next = [...prev];
			next[idx] = { ...next[idx], [field]: value };
			return next;
		});

	const handleGeneratePdf = async () => {
		if (billingLoading) {
			toast({
				title: "Espera un momento",
				description: "Verificando tu plan…",
			});
			return;
		}
		if (billing?.tier === "pro") {
			generateTcpPdf(payload);
			return;
		}
		try {
			const response = await api.post<Blob>(
				"/api/accounting-documents/pdf/tcp",
				payload,
				{ responseType: "blob" },
			);
			const disposition = response.headers["content-disposition"];
			const match =
				typeof disposition === "string"
					? disposition.match(/filename="?([^"]+)"?/)
					: null;
			const filename =
				match?.[1] ??
				`Registro_TCP_${generalData.anio || new Date().getFullYear()}.pdf`;
			const url = window.URL.createObjectURL(response.data);
			const a = Object.assign(document.createElement("a"), {
				href: url,
				download: filename,
			});
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch (error: unknown) {
			const status =
				typeof error === "object" &&
				error !== null &&
				"response" in error &&
				typeof (error as { response?: { status?: number } }).response
					?.status === "number"
					? (error as { response: { status: number } }).response.status
					: null;
			if (status === 402) {
				toast({
					title: "Créditos insuficientes",
					description: "No tienes créditos suficientes",
					variant: "destructive",
				});
				return;
			}
			toast({
				title: "Error",
				description: "No se pudo generar el PDF",
				variant: "destructive",
			});
		}
	};

	// ── Sheet content ──────────────────────────────────────────────────────────
	const renderSheet = () => {
		if (activeSheet === "GENERALES") {
			return (
				<GeneralesSheet data={generalData} onChange={handleGeneralChange} />
			);
		}
		if (activeSheet === "INGRESOS") {
			return (
				<MonthSheet
					title="INGRESOS"
					entries={ingresos}
					totals={monthTotalsIngresos}
					annual={annualIngresos}
					setter={setIngresos}
				/>
			);
		}
		if (activeSheet === "GASTOS") {
			return (
				<MonthSheet
					title="GASTOS"
					entries={gastos}
					totals={monthTotalsGastos}
					annual={annualGastos}
					setter={setGastos}
				/>
			);
		}
		return <TributosSheet tributos={tributos} onChange={handleTributoChange} />;
	};

	return (
		<div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950">
			<style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; background: white; }
        }
      `}</style>

			{/* ── Excel-style toolbar ─────────────────────────────────────────────── */}
			<Toolbar
				pageSize={pageSize}
				onPageSizeChange={setPageSize}
				documentId={documentId}
				isSaving={isSaving}
				onSave={save}
				onExportXlsx={exportToXlsx}
				onExportPdf={handleGeneratePdf}
				onPrint={() => window.print()}
			/>

			{/* ── Sheet area ──────────────────────────────────────────────────────── */}
			<div className="flex-1 overflow-auto">
				<div id="print-area" className="bg-white dark:bg-slate-900 min-h-full">
					{/* Quick insert bar – only for INGRESOS / GASTOS */}
					{(activeSheet === "INGRESOS" || activeSheet === "GASTOS") && (
						<QuickInsertForm
							activeSheet={activeSheet}
							setIngresos={setIngresos}
							setGastos={setGastos}
							onYearChange={(y) => handleGeneralChange("anio", y)}
						/>
					)}

					<div className="overflow-x-auto p-3">{renderSheet()}</div>
				</div>
			</div>

			{/* ── Excel-style tab bar at the bottom ──────────────────────────────── */}
			<SheetTabBar active={activeSheet} onChange={setActiveSheet} />
		</div>
	);
};

export default ExpenseRegisterPage;
