import { type FC, useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CuentaContable, DayAmountRow, MonthCode } from "../accounting/core/types/accountingTypes";

export interface EntryFormData {
	mes: MonthCode;
	dia: string;
	importe: string;
	cuentaId: string;
	nota: string;
}

interface EntryFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: "ingresos" | "gastos";
	cuentas: CuentaContable[];
	initialMonth?: MonthCode;
	editingEntry?: DayAmountRow | null;
	onSubmit: (data: EntryFormData) => void;
}

const EntryFormDialog: FC<EntryFormDialogProps> = ({
	open,
	onOpenChange,
	type,
	cuentas,
	initialMonth,
	editingEntry,
	onSubmit,
}) => {
	const [mes, setMes] = useState<MonthCode>(initialMonth ?? "ENE");
	const [dia, setDia] = useState("");
	const [importe, setImporte] = useState("");
	const [cuentaId, setCuentaId] = useState("");
	const [nota, setNota] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) return;
		if (editingEntry) {
			setDia(editingEntry.dia);
			setImporte(editingEntry.importe);
		} else {
			setDia("");
			setImporte("");
		}
		setCuentaId("");
		setNota("");
		setSaving(false);
	}, [open, editingEntry]);

	const cuentasFiltradas = cuentas.filter(
		(c) => c.tipo === (type === "ingresos" ? "INGRESO" : "GASTO") && c.activo,
	);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!dia.trim() || !importe.trim()) return;
		setSaving(true);
		onSubmit({ mes, dia: dia.trim(), importe: importe.trim(), cuentaId, nota: nota.trim() });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{editingEntry ? "Editar" : "Nuevo"}{" "}
						{type === "ingresos" ? "ingreso" : "gasto"}
					</DialogTitle>
					<DialogDescription>
						Registra un {type === "ingresos" ? "ingreso" : "gasto"} en el mes
						seleccionado. La cuenta contable y la nota son opcionales.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="entry-mes">Mes</Label>
							<Select
								value={mes}
								onValueChange={(v) => setMes(v as MonthCode)}
							>
								<SelectTrigger id="entry-mes">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
										"JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
									].map((m) => (
										<SelectItem key={m} value={m}>
											{m}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="entry-dia">Día</Label>
							<Input
								id="entry-dia"
								type="number"
								min={1}
								max={31}
								placeholder="1-31"
								value={dia}
								onChange={(e) => setDia(e.target.value)}
								required
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="entry-importe">Importe (CUP)</Label>
						<Input
							id="entry-importe"
							type="number"
							min={0}
							step="0.01"
							placeholder="0.00"
							value={importe}
							onChange={(e) => setImporte(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="entry-cuenta">Cuenta contable</Label>
						<Select value={cuentaId} onValueChange={setCuentaId}>
							<SelectTrigger id="entry-cuenta">
								<SelectValue placeholder="Seleccionar cuenta (opcional)" />
							</SelectTrigger>
							<SelectContent>
								{cuentasFiltradas.length === 0 && (
									<SelectItem value="" disabled>
										Sin cuentas de {type === "ingresos" ? "ingreso" : "gasto"}
									</SelectItem>
								)}
								{cuentasFiltradas.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.codigo} · {c.nombre}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="entry-nota">Nota</Label>
						<Textarea
							id="entry-nota"
							placeholder="Descripción del movimiento (opcional)"
							value={nota}
							onChange={(e) => setNota(e.target.value)}
							rows={2}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={saving || !dia.trim() || !importe.trim()}>
							{saving && <Loader2 className="size-4 animate-spin" />}
							{editingEntry ? "Guardar cambios" : "Registrar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default EntryFormDialog;
