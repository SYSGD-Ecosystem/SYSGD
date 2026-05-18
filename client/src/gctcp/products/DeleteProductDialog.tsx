import { type FC, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { ProductoInventario } from "../../accounting/core/types/accountingTypes";

export const DeleteProductDialog: FC<{
	product: ProductoInventario | null;
	open: boolean;
	deleting: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}> = ({ product, open, deleting, onOpenChange, onConfirm }) => {
	const [confirmation, setConfirmation] = useState("");
	const expectedText = product?.nombre ?? "";
	const canConfirm = confirmation === expectedText && !deleting;

	useEffect(() => {
		if (open) setConfirmation("");
	}, [open]);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<AlertDialogTitle>Eliminar producto</AlertDialogTitle>
							<AlertDialogDescription>
								Solo se permite eliminar productos que no esten usados en ventas, compras, almacenes ni historial.
							</AlertDialogDescription>
						</div>
					</div>
				</AlertDialogHeader>

				<div className="space-y-3">
					<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
						Esta accion elimina el producto base del espacio de trabajo activo.
					</div>
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
						Escribe exactamente <span className="font-semibold">{expectedText}</span> para confirmar.
					</label>
					<Input
						value={confirmation}
						onChange={(event) => setConfirmation(event.target.value)}
						placeholder={expectedText}
						disabled={deleting}
					/>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						disabled={!canConfirm}
						onClick={(event) => {
							event.preventDefault();
							onConfirm();
						}}
						className="bg-red-600 text-white hover:bg-red-700"
					>
						{deleting ? "Eliminando..." : "Eliminar producto"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
