import { useEffect, useMemo, useState, type FC } from "react";
import type { CuentaContable, TributoConfig } from "@/accounting/core/types/accountingTypes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TributoConfigSave {
	porcentaje: number;
	deducibleFijo: number;
}

interface TributoConfigDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	config: TributoConfig;
	cuentas: CuentaContable[];
	selectedCuentaIds: string[];
	onSave: (values: TributoConfigSave, cuentaIds: string[]) => void;
}

const toNumber = (value: string): number => {
	const parsed = Number(value.replace(",", "."));
	return Number.isFinite(parsed) ? parsed : 0;
};

export const TributoConfigDialog: FC<TributoConfigDialogProps> = ({
	open,
	onOpenChange,
	config,
	cuentas,
	selectedCuentaIds,
	onSave,
}) => {
	const [porcentaje, setPorcentaje] = useState(String(config.porcentaje));
	const [deducibleFijo, setDeducibleFijo] = useState(String(config.deducibleFijo));
	const [cuentaIds, setCuentaIds] = useState<string[]>(selectedCuentaIds);

	useEffect(() => {
		if (!open) return;
		setPorcentaje(String(config.porcentaje));
		setDeducibleFijo(String(config.deducibleFijo));
		setCuentaIds(selectedCuentaIds);
	}, [open, config, selectedCuentaIds]);

	const activeAccounts = useMemo(
		() => cuentas.filter((cuenta) => cuenta.activo),
		[cuentas],
	);

	const toggleCuenta = (cuentaId: string, checked: boolean): void => {
		setCuentaIds((current) =>
			checked
				? [...current, cuentaId]
				: current.filter((id) => id !== cuentaId),
		);
	};

	const handleSave = (): void => {
		onSave(
			{
				porcentaje: Math.max(0, toNumber(porcentaje)),
				deducibleFijo: Math.max(0, toNumber(deducibleFijo)),
			},
			cuentaIds,
		);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Configurar tributo</DialogTitle>
					<DialogDescription>{config.nombre}</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2">
					<div className="grid gap-2 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="tributo-porcentaje">Porcentaje (%)</Label>
							<Input
								id="tributo-porcentaje"
								inputMode="decimal"
								value={porcentaje}
								onChange={(event) => setPorcentaje(event.target.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="tributo-deducible">Deducible fijo (CUP)</Label>
							<Input
								id="tributo-deducible"
								inputMode="decimal"
								value={deducibleFijo}
								onChange={(event) => setDeducibleFijo(event.target.value)}
							/>
						</div>
					</div>

					<div className="grid gap-2">
						<Label>Cuentas base</Label>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							El auto-cálculo suma los ingresos y gastos del mes vinculados a estas cuentas.
						</p>
						<div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3 dark:border-slate-700">
							{activeAccounts.length === 0 ? (
								<p className="text-sm text-slate-500 dark:text-slate-400">
									No hay cuentas contables activas.
								</p>
							) : (
								activeAccounts.map((cuenta) => (
									<label
										key={cuenta.id}
										className="flex cursor-pointer items-start gap-2 rounded-md p-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
									>
										<Checkbox
											checked={cuentaIds.includes(cuenta.id)}
											onCheckedChange={(checked) =>
												toggleCuenta(cuenta.id, checked === true)
											}
										/>
										<span className="min-w-0">
											<span className="font-medium">{cuenta.codigo}</span>{" "}
											<span className="break-words">{cuenta.nombre}</span>
										</span>
									</label>
								))
							)}
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button type="button" onClick={handleSave}>
						Guardar configuración
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default TributoConfigDialog;
