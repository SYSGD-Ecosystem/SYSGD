import type { ReactNode } from "react";
import type {
	CloudLedgerContainer,
	CloudWorkspaceEntry,
	ContLedgerResponse,
	MonthlyTotals,
} from "../accounting/core/types/accountingTypes";

export type GcTcpView =
	| "dashboard"
	| "generales"
	| "ingresos"
	| "gastos"
	| "tributos"
	| "resumen"
	| "estadoResultado"
	| "libroDiario"
	| "cajaBanco"
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

export type LedgerApiResponse = Omit<ContLedgerResponse, "registro" | "updatedAt"> & {
	registro: CloudLedgerContainer | null;
	updatedAt: string | null;
};

export type NavigationSection = {
	title: string;
	items: NavigationItem[];
};

export type NavigationItem = {
	id: GcTcpView;
	label: string;
	icon: ReactNode;
};

export type WorkspaceAnalysis = {
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
