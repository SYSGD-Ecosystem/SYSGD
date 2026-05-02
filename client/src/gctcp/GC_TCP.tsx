import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DatabaseBackup, Download, Menu, RefreshCw } from "lucide-react";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthSession } from "@/hooks/connection/useAuthSession";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CloudLedgerContainer } from "../accounting/core/types/accountingTypes";
import { calculateWorkspaceAnalysis, formatLedgerDate } from "./accountingMath";
import { EmptyState, GcTcpSidebar } from "./components";
import { DeleteWorkspaceDialog } from "./DeleteWorkspaceDialog";
import { NomenclatorsView } from "./nomenclators/NomenclatorsView";
import { PointOfSaleView } from "./pos/PointOfSaleView";
import { getProductUsage } from "./products/productUtils";
import { getViewTitle } from "./navigation";
import type { GcTcpView, LedgerApiResponse } from "./types";
import {
	BackupView,
	CatalogosView,
	DashboardView,
	EntriesView,
	EstadoResultadoView,
	GeneralView,
	ResumenView,
	SupportView,
	TercerosView,
	TributosView,
} from "./views";

const GC_TCP: FC = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { user, loading: authLoading } = useAuthSession();
	const [loadingLedger, setLoadingLedger] = useState(true);
	const [data, setData] = useState<LedgerApiResponse | null>(null);
	const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
	const [selectedView, setSelectedView] = useState<GcTcpView>("dashboard");
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [savingWorkspace, setSavingWorkspace] = useState(false);
	const [workspaceIdToDelete, setWorkspaceIdToDelete] = useState<string | null>(null);
	const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

	useEffect(() => {
		if (!authLoading && !user) navigate("/login");
	}, [authLoading, navigate, user]);

	const loadLedger = useCallback(async () => {
		if (!user) return;
		setLoadingLedger(true);
		try {
			const { data: response } = await api.get<LedgerApiResponse>("/api/cont-ledger");
			setData(response);
			const ledger = response.registro;
			const firstWorkspace = ledger?.workspaces[0];
			setActiveWorkspaceId(ledger?.activeWorkspaceId || firstWorkspace?.id || "");
		} catch {
			toast({
				title: "Error",
				description: "No se pudo cargar el registro contable",
				variant: "destructive",
			});
			setData(null);
		} finally {
			setLoadingLedger(false);
		}
	}, [toast, user]);

	useEffect(() => {
		if (user) void loadLedger();
	}, [loadLedger, user]);

	const ledger = data?.registro ?? null;
	const analyses = useMemo(
		() => ledger?.workspaces.map((workspace) => calculateWorkspaceAnalysis(workspace)) ?? [],
		[ledger],
	);
	const activeAnalysis = analyses.find((analysis) => analysis.workspace.id === activeWorkspaceId) ?? analyses[0] ?? null;
	const activeWorkspace = activeAnalysis?.workspace ?? null;

	const totals = useMemo(
		() => ({
			ingresos: analyses.reduce((total, analysis) => total + analysis.totalIngresos, 0),
			gastos: analyses.reduce((total, analysis) => total + analysis.totalGastos, 0),
			neto: analyses.reduce((total, analysis) => total + analysis.baseImponible, 0),
			asientos: analyses.reduce((total, analysis) => total + analysis.incomeRows + analysis.expenseRows, 0),
		}),
		[analyses],
	);

	const handleSelectWorkspace = async (workspaceId: string) => {
		if (!ledger || workspaceId === activeWorkspaceId) return;
		const updatedLedger: CloudLedgerContainer = { ...ledger, activeWorkspaceId: workspaceId };
		setActiveWorkspaceId(workspaceId);
		setData((current) => current ? { ...current, registro: updatedLedger } : current);
		setSavingWorkspace(true);
		try {
			await api.put("/api/cont-ledger", {
				registro: updatedLedger,
				inventarioRegistro: data?.inventarioRegistro ?? null,
			});
			toast({ title: "Espacio activo actualizado" });
		} catch {
			setActiveWorkspaceId(ledger.activeWorkspaceId);
			setData((current) => current ? { ...current, registro: ledger } : current);
			toast({
				title: "No se pudo guardar el espacio activo",
				description: "La vista cambio se revirtio para mantener la sincronizacion.",
				variant: "destructive",
			});
		} finally {
			setSavingWorkspace(false);
		}
	};

	const handleDeleteWorkspace = async () => {
		if (!ledger || !workspaceIdToDelete) return;
		if (ledger.workspaces.length <= 1) {
			toast({
				title: "No se puede eliminar",
				description: "Debe existir al menos un espacio de trabajo.",
				variant: "destructive",
			});
			return;
		}

		const workspaceToDelete = ledger.workspaces.find((workspace) => workspace.id === workspaceIdToDelete);
		if (!workspaceToDelete) return;

		const remainingWorkspaces = ledger.workspaces.filter((workspace) => workspace.id !== workspaceIdToDelete);
		const nextActiveWorkspaceId =
			ledger.activeWorkspaceId === workspaceIdToDelete
				? remainingWorkspaces[0]?.id ?? ""
				: ledger.activeWorkspaceId;
		const updatedLedger: CloudLedgerContainer = {
			...ledger,
			activeWorkspaceId: nextActiveWorkspaceId,
			workspaces: remainingWorkspaces,
		};

		setSavingWorkspace(true);
		try {
			await api.put("/api/cont-ledger", {
				registro: updatedLedger,
				inventarioRegistro: data?.inventarioRegistro ?? null,
			});
			setData((current) => current ? { ...current, registro: updatedLedger } : current);
			setActiveWorkspaceId(nextActiveWorkspaceId);
			setWorkspaceIdToDelete(null);
			toast({
				title: "Espacio eliminado",
				description: `${workspaceToDelete.name} fue eliminado del ledger.`,
			});
		} catch {
			toast({
				title: "No se pudo eliminar",
				description: "El espacio de trabajo no fue modificado.",
				variant: "destructive",
			});
		} finally {
			setSavingWorkspace(false);
		}
	};

	const handleDeleteProduct = async (productId: string) => {
		if (!ledger || !activeWorkspace) return;
		const usage = getProductUsage(activeWorkspace, productId);
		if (!usage.canDelete) {
			toast({
				title: "Producto en uso",
				description: `No se puede eliminar porque aparece en: ${usage.labels.join(", ")}.`,
				variant: "destructive",
			});
			return;
		}

		const product = activeWorkspace.registro.inventario.productos.find((item) => item.id === productId);
		if (!product) return;

		const updatedWorkspaces = ledger.workspaces.map((workspace) => {
			if (workspace.id !== activeWorkspace.id) return workspace;
			return {
				...workspace,
				registro: {
					...workspace.registro,
					inventario: {
						...workspace.registro.inventario,
						productos: workspace.registro.inventario.productos.filter((item) => item.id !== productId),
					},
				},
			};
		});
		const updatedLedger: CloudLedgerContainer = { ...ledger, workspaces: updatedWorkspaces };

		setDeletingProductId(productId);
		try {
			await api.put("/api/cont-ledger", {
				registro: updatedLedger,
				inventarioRegistro: data?.inventarioRegistro ?? null,
			});
			setData((current) => current ? { ...current, registro: updatedLedger } : current);
			toast({
				title: "Producto eliminado",
				description: `${product.nombre} fue eliminado del espacio activo.`,
			});
		} catch {
			toast({
				title: "No se pudo eliminar",
				description: "El producto no fue modificado.",
				variant: "destructive",
			});
		} finally {
			setDeletingProductId(null);
		}
	};

	const handleDownloadBackup = () => {
		if (!ledger) return;
		const backup = {
			registro: ledger,
			inventarioRegistro: data?.inventarioRegistro ?? null,
			updatedAt: data?.updatedAt ?? new Date().toISOString(),
			exportedAt: new Date().toISOString(),
			source: "sysgd-client-gctcp",
		};
		const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `gctcp-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
		toast({ title: "Respaldo descargado" });
	};

	const renderContent = () => {
		if (!activeWorkspace || !activeAnalysis) {
			return <EmptyState title="Sin espacio activo" description="Selecciona o carga un respaldo para visualizar el registro." icon={<DatabaseBackup />} />;
		}

		switch (selectedView) {
			case "dashboard":
				return (
					<DashboardView
						analyses={analyses}
						activeAnalysis={activeAnalysis}
						activeWorkspaceId={activeWorkspace.id}
						savingWorkspace={savingWorkspace}
						totals={totals}
						onSelectWorkspace={handleSelectWorkspace}
						onRequestDeleteWorkspace={setWorkspaceIdToDelete}
					/>
				);
			case "generales":
				return <GeneralView workspace={activeWorkspace} analysis={activeAnalysis} />;
			case "ingresos":
				return <EntriesView workspace={activeWorkspace} type="ingresos" />;
			case "gastos":
				return <EntriesView workspace={activeWorkspace} type="gastos" />;
			case "tributos":
				return <TributosView workspace={activeWorkspace} analysis={activeAnalysis} />;
			case "resumen":
				return <ResumenView analysis={activeAnalysis} />;
			case "estadoResultado":
				return <EstadoResultadoView workspace={activeWorkspace} />;
			case "ventas":
				return <PointOfSaleView workspace={activeWorkspace} />;
			case "terceros":
				return <TercerosView workspace={activeWorkspace} />;
			case "catalogos":
				return (
					<CatalogosView
						workspace={activeWorkspace}
						deletingProduct={Boolean(deletingProductId)}
						onDeleteProduct={handleDeleteProduct}
					/>
				);
			case "nomencladores":
				return <NomenclatorsView />;
			case "respaldo":
				return <BackupView onReload={loadLedger} onDownloadBackup={handleDownloadBackup} canDownload={Boolean(ledger)} />;
			case "documentos":
			case "seguridad":
			case "licencias":
			case "acerca":
			case "ayuda":
			case "recursos":
				return <SupportView view={selectedView} />;
			default:
				return null;
		}
	};

	if (authLoading || loadingLedger) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-slate-950">
				<Loading textLoading={authLoading ? "Verificando sesion..." : "Cargando registro contable..."} />
			</div>
		);
	}

	if (!user) return null;

	if (!ledger || ledger.workspaces.length === 0) {
		return (
			<div className="h-full w-full overflow-auto bg-slate-50 p-4 dark:bg-slate-950">
				<div className="mx-auto max-w-4xl">
					<BackupView onReload={loadLedger} onDownloadBackup={handleDownloadBackup} canDownload={false} />
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
			<DeleteWorkspaceDialog
				workspace={ledger.workspaces.find((workspace) => workspace.id === workspaceIdToDelete) ?? null}
				open={Boolean(workspaceIdToDelete)}
				deleting={savingWorkspace}
				onOpenChange={(open) => {
					if (!open && !savingWorkspace) setWorkspaceIdToDelete(null);
				}}
				onConfirm={handleDeleteWorkspace}
			/>
			<div className="hidden lg:block">
				<GcTcpSidebar view={selectedView} onSelect={setSelectedView} />
			</div>
			{isMobileSidebarOpen && (
				<div className="fixed inset-0 z-50 flex lg:hidden">
					<button type="button" className="absolute inset-0 bg-slate-950/60" aria-label="Cerrar menu" onClick={() => setIsMobileSidebarOpen(false)} />
					<div className="relative h-full">
						<GcTcpSidebar view={selectedView} onSelect={setSelectedView} onClose={() => setIsMobileSidebarOpen(false)} />
					</div>
				</div>
			)}
			<main className="min-w-0 flex-1 overflow-auto">
				<header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							<Button variant="outline" size="icon" className="lg:hidden" onClick={() => setIsMobileSidebarOpen(true)} aria-label="Abrir menu">
								<Menu />
							</Button>
							<div className="min-w-0">
								<p className="text-xs font-medium uppercase text-emerald-700 dark:text-emerald-300">GC TCP escritorio</p>
								<h1 className="truncate text-xl font-semibold text-slate-950 dark:text-slate-50">{getViewTitle(selectedView)}</h1>
								<p className="truncate text-sm text-slate-500 dark:text-slate-400">
									{activeWorkspace?.name ?? "Sin espacio"} / {formatLedgerDate(data?.updatedAt ?? null)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="outline">{ledger.workspaces.length} workspace{ledger.workspaces.length === 1 ? "" : "s"}</Badge>
							<Button variant="outline" size="sm" onClick={handleDownloadBackup}>
								<Download />
								Respaldo
							</Button>
							<Button variant="outline" size="sm" onClick={loadLedger} disabled={loadingLedger || savingWorkspace}>
								<RefreshCw className={cn(savingWorkspace && "animate-spin")} />
								Actualizar
							</Button>
						</div>
					</div>
					<Separator className="mt-3 lg:hidden" />
				</header>
				<div className="p-4 sm:p-6">{renderContent()}</div>
			</main>
		</div>
	);
};

export default GC_TCP;
