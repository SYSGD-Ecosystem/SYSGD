import { FileText, Landmark, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState, type FC, type ReactElement } from "react";
import type {
	CloudWorkspaceEntry,
	TributoConfig,
	TributoKey,
	TributoRow,
} from "@/accounting/core/types/accountingTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { MONTH_CODES, MONTH_NAMES } from "@/accounting/core/utils/constants";
import { formatMoney, parseAmount, tributoTotal } from "../accountingMath";
import type { WorkspaceAnalysis } from "../types";
import type { TributoConfigUpdate } from "../hooks/useTributoRegistry";
import TributoConfigDialog from "./TributoConfigDialog";
import {
	applyAutoCalculatedTributos,
	getTributoConfigs,
	getTributoValue,
	setTributoValue,
} from "./tributoMath";

interface TributosViewProps {
	workspace: CloudWorkspaceEntry;
	analysis: WorkspaceAnalysis;
	selectedYear: number;
	saving: boolean;
	onSaveMonth: (monthIndex: number, row: TributoRow) => void;
	onUpdateConfig: (
		key: TributoKey,
		update: TributoConfigUpdate,
		cuentaIds: string[],
	) => void;
	onGenerateDj: () => void;
}

const TributoItem: FC<{
	config: TributoConfig;
	row: TributoRow;
	manualValue: string;
	cuentasCount: number;
	saving: boolean;
	onManualChange: (value: string) => void;
	onToggleIncluido: (checked: boolean) => void;
	onToggleAutocalcular: (checked: boolean) => void;
	onConfigure: () => void;
}> = ({
	config,
	row,
	manualValue,
	cuentasCount,
	saving,
	onManualChange,
	onToggleIncluido,
	onToggleAutocalcular,
	onConfigure,
}) => {
	const displayValue = !config.incluido
		? "—"
		: config.autocalcular
			? getTributoValue(row, config.key)
			: manualValue;
	const numericValue = config.autocalcular ? parseAmount(displayValue) : parseAmount(manualValue);

	return (
		<div className="flex h-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="break-words text-sm font-medium text-slate-900 dark:text-slate-100">
						{config.nombre}
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						{config.categoria === "TRIBUTO" ? "Tributo" : "Otro deducible"} ·{" "}
						{config.porcentaje}% · {cuentasCount} cuenta(s)
					</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onConfigure}
					disabled={saving}
					aria-label={`Configurar ${config.nombre}`}
				>
					<Settings2 className="size-4" />
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-4 text-xs">
				<label className="flex cursor-pointer items-center gap-2">
					<Checkbox
						checked={config.incluido}
						onCheckedChange={(checked) => onToggleIncluido(checked === true)}
						disabled={saving}
					/>
					Incluido
				</label>
				<label className="flex cursor-pointer items-center gap-2">
					<Checkbox
						checked={config.autocalcular}
						onCheckedChange={(checked) => onToggleAutocalcular(checked === true)}
						disabled={saving || !config.incluido}
					/>
					Auto-cálculo
				</label>
			</div>

			<div className="mt-auto">
				{config.incluido && !config.autocalcular ? (
					<Input
						inputMode="decimal"
						value={manualValue}
						onChange={(event) => onManualChange(event.target.value)}
						placeholder="0.00"
						disabled={saving}
						aria-label={`Importe de ${config.nombre}`}
					/>
				) : (
					<div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
						<span className="text-slate-500 dark:text-slate-400">
							{config.autocalcular ? "Calculado" : "No incluido"}
						</span>
						<span className="font-semibold">
							{config.incluido ? formatMoney(numericValue) : "—"}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

export const TributosView: FC<TributosViewProps> = ({
	workspace,
	analysis,
	selectedYear,
	saving,
	onSaveMonth,
	onUpdateConfig,
	onGenerateDj,
}) => {
	const [monthIndex, setMonthIndex] = useState(0);
	const [manualValues, setManualValues] = useState<Record<string, string>>({});
	const [configuringKey, setConfiguringKey] = useState<TributoKey | null>(null);

	const configs = useMemo(() => getTributoConfigs(workspace), [workspace]);
	const relations = useMemo(
		() => workspace.accounting.tributoCuentaBases ?? [],
		[workspace.accounting.tributoCuentaBases],
	);
	const previewRows = useMemo(() => {
		const accountByEntryId = new Map<string, string>();
		for (const relation of workspace.accounting.ingresoGastoCuentas ?? []) {
			accountByEntryId.set(relation.ingresoGastoId, relation.cuentaId);
		}
		return applyAutoCalculatedTributos({
			registro: workspace.registro,
			year: selectedYear,
			configs,
			relations,
			accountByEntryId,
		});
	}, [workspace, selectedYear, configs, relations]);

	const row = previewRows[monthIndex] ?? previewRows[0];
	const configuring = configs.find((config) => config.key === configuringKey) ?? null;
	const selectedCuentaIds = useMemo(
		() =>
			configuring
				? relations
						.filter((relation) => relation.tributoKey === configuring.key)
						.map((relation) => relation.cuentaId)
				: [],
		[configuring, relations],
	);

	useEffect(() => {
		const next: Record<string, string> = {};
		for (const config of configs) {
			next[config.key] = getTributoValue(row, config.key);
		}
		setManualValues(next);
	}, [configs, monthIndex, row]);

	const tributos = configs.filter((config) => config.categoria === "TRIBUTO");
	const otrosDeducibles = configs.filter((config) => config.categoria === "OTRO_DEDUCIBLE");

	const handleToggle = (
		config: TributoConfig,
		update: TributoConfigUpdate,
	): void => {
		const cuentaIds = relations
			.filter((relation) => relation.tributoKey === config.key)
			.map((relation) => relation.cuentaId);
		onUpdateConfig(config.key, update, cuentaIds);
	};

	const handleSaveMonth = (): void => {
		let nextRow: TributoRow = row;
		for (const config of configs) {
			if (config.incluido && !config.autocalcular) {
				nextRow = setTributoValue(
					nextRow,
					config.key,
					manualValues[config.key] ?? "",
				);
			}
		}
		onSaveMonth(monthIndex, nextRow);
	};

	const renderGroup = (
		title: string,
		items: TributoConfig[],
	): ReactElement => (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
					{title}
				</h3>
				<Badge variant="outline">{items.length}</Badge>
			</div>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{items.map((config) => {
					const cuentasCount = relations.filter(
						(relation) => relation.tributoKey === config.key,
					).length;
					return (
						<TributoItem
							key={config.key}
							config={config}
							row={row}
							manualValue={manualValues[config.key] ?? ""}
							cuentasCount={cuentasCount}
							saving={saving}
							onManualChange={(value) =>
								setManualValues((current) => ({
									...current,
									[config.key]: value,
								}))
							}
							onToggleIncluido={(checked) =>
								handleToggle(config, { incluido: checked })
							}
							onToggleAutocalcular={(checked) =>
								handleToggle(config, { autocalcular: checked })
							}
							onConfigure={() => setConfiguringKey(config.key)}
						/>
					);
				})}
			</div>
		</div>
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
						Tributos y otros deducibles
					</h2>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						Año fiscal {selectedYear} · {workspace.name}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={String(monthIndex)}
						onValueChange={(value) => setMonthIndex(Number(value))}
					>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Mes" />
						</SelectTrigger>
						<SelectContent>
							{MONTH_NAMES.map((month, index) => (
								<SelectItem key={MONTH_CODES[index]} value={String(index)}>
									{month}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button type="button" variant="outline" onClick={onGenerateDj}>
						<FileText className="mr-1 size-4" />
						Generar DJ
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-3">
				<Card className="rounded-lg shadow-sm">
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-xs uppercase text-slate-500 dark:text-slate-400">
							Tributos del año
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<p className="flex items-center gap-2 text-lg font-semibold">
							<Landmark className="size-4 text-sky-600" />
							{formatMoney(analysis.totalTributos)}
						</p>
					</CardContent>
				</Card>
				<Card className="rounded-lg shadow-sm">
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-xs uppercase text-slate-500 dark:text-slate-400">
							Otros deducibles
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<p className="text-lg font-semibold">
							{formatMoney(analysis.totalOtrosDeducibles)}
						</p>
					</CardContent>
				</Card>
				<Card className="rounded-lg shadow-sm">
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-xs uppercase text-slate-500 dark:text-slate-400">
							Total del mes
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<p className="text-lg font-semibold">
							{formatMoney(tributoTotal(row))}
						</p>
					</CardContent>
				</Card>
			</div>

			{renderGroup("Tributos pagados deducibles", tributos)}
			{renderGroup("Otros gastos deducibles", otrosDeducibles)}

			<div className="flex justify-end">
				<Button type="button" onClick={handleSaveMonth} disabled={saving}>
					{saving ? "Guardando…" : `Guardar tributos de ${MONTH_NAMES[monthIndex]}`}
				</Button>
			</div>

			{configuring && (
				<TributoConfigDialog
					open
					onOpenChange={(open) => {
						if (!open) setConfiguringKey(null);
					}}
					config={configuring}
					cuentas={workspace.accounting.cuentasContables}
					selectedCuentaIds={selectedCuentaIds}
					onSave={(values, cuentaIds) => {
						onUpdateConfig(
							configuring.key,
							{
								porcentaje: values.porcentaje,
								deducibleFijo: values.deducibleFijo,
							},
							cuentaIds,
						);
					}}
				/>
			)}
		</div>
	);
};

export default TributosView;
