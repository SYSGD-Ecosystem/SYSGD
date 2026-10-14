import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
	CloudLedgerContainer,
	DayAmountRow,
	IngresoGastoCuenta,
	IngresoGastoNota,
	MonthCode,
} from "../../accounting/core/types/accountingTypes";
import type { LedgerRepository } from "../data/LedgerRepository";

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
	repository: LedgerRepository;
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
	repository,
	onDataChange,
}: UseEntryRegistryParams): UseEntryRegistryReturn {
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);

	const persist = useCallback(
		async (updated: CloudLedgerContainer, successMsg: string): Promise<boolean> => {
			setSaving(true);
			try {
				await repository.saveLedger(updated, null);
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
		[repository, onDataChange, toast],
	);

	const addEntry = useCallback(
		async (type: EntryType, input: EntryInput): Promise<boolean> => {
			if (!container) return false;
			const entryId = generateEntryId(type);
			const now = Date.now();
			const newRow: DayAmountRow = {
				id: entryId,
				dia: input.dia,
				importe: input.importe,
			};

			const updated: CloudLedgerContainer = {
				...container,
				workspaces: container.workspaces.map((ws) => {
					if (ws.id !== activeWorkspaceId) return ws;
					return {
						...ws,
						registro: {
							...ws.registro,
							[type]: {
								...ws.registro[type],
								[input.mes]: [...(ws.registro[type][input.mes] ?? []), newRow],
							},
						},
						accounting: {
							...ws.accounting,
							ingresoGastoCuentas: input.cuentaId
								? [
										...(ws.accounting.ingresoGastoCuentas ?? []),
										{
											id: generateRelId(),
											ingresoGastoId: entryId,
											mes: input.mes,
											tipo: type === "ingresos" ? "INGRESO" : "GASTO",
											cuentaId: input.cuentaId,
											createdAt: now,
										},
									]
								: ws.accounting.ingresoGastoCuentas ?? [],
							ingresoGastoNotas: input.nota
								? [
										...(ws.accounting.ingresoGastoNotas ?? []),
										{
											id: generateRelId(),
											ingresoGastoId: entryId,
											mes: input.mes,
											tipo: type === "ingresos" ? "INGRESO" : "GASTO",
											nota: input.nota,
											createdAt: now,
										},
									]
								: ws.accounting.ingresoGastoNotas ?? [],
						},
					};
				}),
			};

			return persist(updated, `${type === "ingresos" ? "Ingreso" : "Gasto"} registrado`);
		},
		[container, activeWorkspaceId, persist],
	);

	const editEntry = useCallback(
		async (type: EntryType, entryId: string, input: EntryInput): Promise<boolean> => {
			if (!container) return false;
			const now = Date.now();

			const updated: CloudLedgerContainer = {
				...container,
				workspaces: container.workspaces.map((ws) => {
					if (ws.id !== activeWorkspaceId) return ws;
					return {
						...ws,
						registro: {
							...ws.registro,
							[type]: {
								...ws.registro[type],
								[input.mes]: (ws.registro[type][input.mes] ?? []).map((row) =>
									row.id === entryId
										? { ...row, dia: input.dia, importe: input.importe }
										: row,
								),
							},
						},
						accounting: {
							...ws.accounting,
							ingresoGastoCuentas: input.cuentaId
								? [
										...(ws.accounting.ingresoGastoCuentas ?? []).filter(
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
								: (ws.accounting.ingresoGastoCuentas ?? []).filter(
										(rel: IngresoGastoCuenta) => rel.ingresoGastoId !== entryId,
									),
							ingresoGastoNotas: input.nota
								? [
										...(ws.accounting.ingresoGastoNotas ?? []).filter(
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
								: (ws.accounting.ingresoGastoNotas ?? []).filter(
										(n: IngresoGastoNota) => n.ingresoGastoId !== entryId,
									),
						},
					};
				}),
			};

			return persist(updated, "Movimiento actualizado");
		},
		[container, activeWorkspaceId, persist],
	);

	const deleteEntry = useCallback(
		async (type: EntryType, entryId: string): Promise<boolean> => {
			if (!container) return false;

			const updated: CloudLedgerContainer = {
				...container,
				workspaces: container.workspaces.map((ws) => {
					if (ws.id !== activeWorkspaceId) return ws;

					const newRegistro = { ...ws.registro };
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
						...ws,
						registro: newRegistro,
						accounting: {
							...ws.accounting,
							ingresoGastoCuentas: (ws.accounting.ingresoGastoCuentas ?? []).filter(
								(rel: IngresoGastoCuenta) => rel.ingresoGastoId !== entryId,
							),
							ingresoGastoNotas: (ws.accounting.ingresoGastoNotas ?? []).filter(
								(n: IngresoGastoNota) => n.ingresoGastoId !== entryId,
							),
						},
					};
				}),
			};

			return persist(updated, "Movimiento eliminado");
		},
		[container, activeWorkspaceId, persist],
	);

	return { saving, addEntry, editEntry, deleteEntry };
}
