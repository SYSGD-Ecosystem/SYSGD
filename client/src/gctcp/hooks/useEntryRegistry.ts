import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
	CloudLedgerContainer,
	CloudWorkspaceEntry,
	DayAmountRow,
	IngresoGastoCuenta,
	IngresoGastoNota,
	InventarioRegistro,
	MonthCode,
} from "../../accounting/core/types/accountingTypes";
import type { LedgerRepository } from "../data/LedgerRepository";
import { recalculateWorkspaceTributos } from "../tributos/tributoMath";

export type EntryType = "ingresos" | "gastos";

export interface EntryInput {
	mes: MonthCode;
	dia: string;
	importe: string;
	cuentaId: string;
	nota: string;
}

interface UseEntryRegistryParams {
	container: CloudLedgerContainer | null;
	activeWorkspaceId: string;
	selectedYear: number;
	repository: LedgerRepository;
	inventarioRegistro: InventarioRegistro | null;
	onDataChange?: (updated: CloudLedgerContainer) => void;
}

interface UseEntryRegistryReturn {
	saving: boolean;
	addEntry: (type: EntryType, input: EntryInput) => Promise<boolean>;
	editEntry: (type: EntryType, entryId: string, input: EntryInput) => Promise<boolean>;
	deleteEntry: (type: EntryType, entryId: string) => Promise<boolean>;
}

let entryCounter = 0;
function generateEntryId(type: EntryType): string {
	entryCounter++;
	return `${type}-${Date.now()}-${entryCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateRelId(): string {
	return `rel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useEntryRegistry({
	container,
	activeWorkspaceId,
	selectedYear,
	repository,
	inventarioRegistro,
	onDataChange,
}: UseEntryRegistryParams): UseEntryRegistryReturn {
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);

	const persist = useCallback(
		async (updated: CloudLedgerContainer, successMsg: string): Promise<boolean> => {
			setSaving(true);
			try {
				await repository.saveLedger(updated, inventarioRegistro);
				onDataChange?.(updated);
				toast({ title: successMsg });
				return true;
			} catch {
				toast({
					title: "No se pudo guardar",
					description: "Los datos no fueron modificados. Intenta de nuevo.",
					variant: "destructive",
				});
				return false;
			} finally {
				setSaving(false);
			}
		},
		[repository, inventarioRegistro, onDataChange, toast],
	);

	const updateWorkspace = useCallback(
		(
			updater: (workspace: CloudWorkspaceEntry) => CloudWorkspaceEntry,
		): CloudLedgerContainer | null => {
			if (!container) return null;
			return {
				...container,
				workspaces: container.workspaces.map((workspace) =>
					workspace.id === activeWorkspaceId
						? recalculateWorkspaceTributos(updater(workspace), selectedYear)
						: workspace,
				),
			};
		},
		[container, activeWorkspaceId, selectedYear],
	);

	const addEntry = useCallback(
		async (type: EntryType, input: EntryInput): Promise<boolean> => {
			const entryId = generateEntryId(type);
			const now = Date.now();
			const newRow: DayAmountRow = {
				id: entryId,
				anio: selectedYear,
				dia: input.dia,
				importe: input.importe,
			};

			const updated = updateWorkspace((workspace) => ({
				...workspace,
				registro: {
					...workspace.registro,
					[type]: {
						...workspace.registro[type],
						[input.mes]: [...(workspace.registro[type][input.mes] ?? []), newRow],
					},
				},
				accounting: {
					...workspace.accounting,
					ingresoGastoCuentas: input.cuentaId
						? [
								...(workspace.accounting.ingresoGastoCuentas ?? []),
								{
									id: generateRelId(),
									ingresoGastoId: entryId,
									mes: input.mes,
									tipo: type === "ingresos" ? "INGRESO" : "GASTO",
									cuentaId: input.cuentaId,
									createdAt: now,
								},
							]
						: workspace.accounting.ingresoGastoCuentas ?? [],
					ingresoGastoNotas: input.nota
						? [
								...(workspace.accounting.ingresoGastoNotas ?? []),
								{
									id: generateRelId(),
									ingresoGastoId: entryId,
									mes: input.mes,
									tipo: type === "ingresos" ? "INGRESO" : "GASTO",
									nota: input.nota,
									createdAt: now,
								},
							]
						: workspace.accounting.ingresoGastoNotas ?? [],
				},
			}));

			if (!updated) return false;
			return persist(updated, `${type === "ingresos" ? "Ingreso" : "Gasto"} registrado`);
		},
		[persist, selectedYear, updateWorkspace],
	);

	const editEntry = useCallback(
		async (type: EntryType, entryId: string, input: EntryInput): Promise<boolean> => {
			const now = Date.now();

			const updated = updateWorkspace((workspace) => ({
				...workspace,
				registro: {
					...workspace.registro,
					[type]: {
						...workspace.registro[type],
						[input.mes]: (workspace.registro[type][input.mes] ?? []).map((row) =>
							row.id === entryId
								? { ...row, anio: selectedYear, dia: input.dia, importe: input.importe }
								: row,
						),
					},
				},
				accounting: {
					...workspace.accounting,
					ingresoGastoCuentas: input.cuentaId
						? [
								...(workspace.accounting.ingresoGastoCuentas ?? []).filter(
									(rel: IngresoGastoCuenta) => rel.ingresoGastoId !== entryId,
								),
								{
									id: generateRelId(),
									ingresoGastoId: entryId,
									mes: input.mes,
									tipo: type === "ingresos" ? "INGRESO" : "GASTO",
									cuentaId: input.cuentaId,
									createdAt: now,
								},
							]
						: (workspace.accounting.ingresoGastoCuentas ?? []).filter(
								(rel: IngresoGastoCuenta) => rel.ingresoGastoId !== entryId,
							),
					ingresoGastoNotas: input.nota
						? [
								...(workspace.accounting.ingresoGastoNotas ?? []).filter(
									(n: IngresoGastoNota) => n.ingresoGastoId !== entryId,
								),
								{
									id: generateRelId(),
									ingresoGastoId: entryId,
									mes: input.mes,
									tipo: type === "ingresos" ? "INGRESO" : "GASTO",
									nota: input.nota,
									createdAt: now,
								},
							]
						: (workspace.accounting.ingresoGastoNotas ?? []).filter(
								(n: IngresoGastoNota) => n.ingresoGastoId !== entryId,
							),
				},
			}));

			if (!updated) return false;
			return persist(updated, "Movimiento actualizado");
		},
		[persist, selectedYear, updateWorkspace],
	);

	const deleteEntry = useCallback(
		async (type: EntryType, entryId: string): Promise<boolean> => {
			const updated = updateWorkspace((workspace) => {
				const newRegistro = { ...workspace.registro };
				for (const mes of Object.keys(newRegistro[type]) as MonthCode[]) {
					const rows = newRegistro[type][mes] ?? [];
					if (rows.some((r: DayAmountRow) => r.id === entryId)) {
						newRegistro[type] = {
							...newRegistro[type],
							[mes]: rows.filter((r: DayAmountRow) => r.id !== entryId),
						};
					}
				}

				return {
					...workspace,
					registro: newRegistro,
					accounting: {
						...workspace.accounting,
						ingresoGastoCuentas: (workspace.accounting.ingresoGastoCuentas ?? []).filter(
							(rel: IngresoGastoCuenta) => rel.ingresoGastoId !== entryId,
						),
						ingresoGastoNotas: (workspace.accounting.ingresoGastoNotas ?? []).filter(
							(n: IngresoGastoNota) => n.ingresoGastoId !== entryId,
						),
					},
				};
			});

			if (!updated) return false;
			return persist(updated, "Movimiento eliminado");
		},
		[persist, updateWorkspace],
	);

	return { saving, addEntry, editEntry, deleteEntry };
}
