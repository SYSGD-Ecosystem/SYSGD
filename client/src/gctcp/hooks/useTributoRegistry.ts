import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
	CloudLedgerContainer,
	CloudWorkspaceEntry,
	InventarioRegistro,
	TributoConfig,
	TributoCuentaBase,
	TributoKey,
	TributoRow,
} from "../../accounting/core/types/accountingTypes";
import type { LedgerRepository } from "../data/LedgerRepository";
import {
	ensureTributoRows,
	getTributoConfigs,
	recalculateWorkspaceTributos,
} from "../tributos/tributoMath";

export type TributoConfigUpdate = Partial<
	Pick<TributoConfig, "incluido" | "autocalcular" | "porcentaje" | "deducibleFijo">
>;

interface UseTributoRegistryParams {
	container: CloudLedgerContainer | null;
	activeWorkspaceId: string;
	selectedYear: number;
	repository: LedgerRepository;
	inventarioRegistro: InventarioRegistro | null;
	onDataChange?: (updated: CloudLedgerContainer) => void;
}

interface UseTributoRegistryReturn {
	saving: boolean;
	saveMonth: (monthIndex: number, row: TributoRow) => Promise<boolean>;
	updateConfig: (
		key: TributoKey,
		update: TributoConfigUpdate,
		cuentaIds: string[],
	) => Promise<boolean>;
}

export function useTributoRegistry({
	container,
	activeWorkspaceId,
	selectedYear,
	repository,
	inventarioRegistro,
	onDataChange,
}: UseTributoRegistryParams): UseTributoRegistryReturn {
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
					title: "No se pudieron guardar los tributos",
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

	const saveMonth = useCallback(
		async (monthIndex: number, row: TributoRow): Promise<boolean> => {
			const updated = updateWorkspace((workspace) => {
				const tributos = ensureTributoRows(workspace.registro.tributos);
				const current = tributos[monthIndex] ?? row;
				tributos[monthIndex] = { ...current, ...row, mes: current.mes };

				return {
					...workspace,
					registro: {
						...workspace.registro,
						tributos,
					},
				};
			});

			if (!updated) return false;
			return persist(updated, "Tributos del mes guardados");
		},
		[persist, updateWorkspace],
	);

	const updateConfig = useCallback(
		async (
			key: TributoKey,
			update: TributoConfigUpdate,
			cuentaIds: string[],
		): Promise<boolean> => {
			const updated = updateWorkspace((workspace) => {
				const configs = getTributoConfigs(workspace).map((config) =>
					config.key === key
						? {
								...config,
								...update,
								updatedAt: Date.now(),
							}
						: config,
				);

				const now = Date.now();
				const otherRelations = (workspace.accounting.tributoCuentaBases ?? []).filter(
					(relation) => relation.tributoKey !== key,
				);
				const nextRelations: TributoCuentaBase[] = cuentaIds
					.map((cuentaId) => cuentaId.trim())
					.filter((cuentaId, index, list) => cuentaId !== "" && list.indexOf(cuentaId) === index)
					.map((cuentaId) => ({
						tributoKey: key,
						cuentaId,
						createdAt: now,
					}));

				return {
					...workspace,
					accounting: {
						...workspace.accounting,
						tributoConfigs: configs,
						tributoCuentaBases: [...otherRelations, ...nextRelations],
					},
				};
			});

			if (!updated) return false;
			return persist(updated, "Configuración del tributo actualizada");
		},
		[persist, updateWorkspace],
	);

	return { saving, saveMonth, updateConfig };
}
