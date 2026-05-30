import { type FC, useEffect, useMemo, useState } from "react";
import { Boxes, CircleDollarSign } from "lucide-react";
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
import type { Almacen, ProductoInventario, StockRegistro } from "../../accounting/core/types/accountingTypes";
import { formatMoney } from "../accountingMath";

export type ProductPriceType = "VENTA" | "COMPRA";

export type ProductPriceUpdate = {
	productId: string;
	tipoPrecio: ProductPriceType;
	precio: number;
};

export type ProductStockUpdate = {
	productId: string;
	almacenId: string;
	stockDisponible: number;
	modoStock: StockRegistro["modoStock"];
};

const parsePositiveNumber = (value: string): number | null => {
	const normalized = value.replace(",", ".").trim();
	if (!normalized) return null;
	const numberValue = Number(normalized);
	return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
};

export const ProductPriceDialog: FC<{
	product: ProductoInventario | null;
	priceType: ProductPriceType | null;
	currentPrice: number | null;
	open: boolean;
	saving: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (payload: ProductPriceUpdate) => void;
}> = ({ product, priceType, currentPrice, open, saving, onOpenChange, onSave }) => {
	const [price, setPrice] = useState("");
	const parsedPrice = parsePositiveNumber(price);
	const canSave = Boolean(product && priceType && parsedPrice !== null && !saving);
	const title = priceType === "COMPRA" ? "Editar precio de compra" : "Editar precio de venta";

	useEffect(() => {
		if (!open) return;
		setPrice(currentPrice !== null && Number.isFinite(currentPrice) ? String(currentPrice) : "");
	}, [currentPrice, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
							<CircleDollarSign className="size-5" />
						</div>
						<div>
							<DialogTitle>{title}</DialogTitle>
							<DialogDescription>
								Actualiza el precio vigente de {product?.nombre ?? "este producto"} en el catalogo.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-2">
					<Label htmlFor="product-price">Nuevo precio</Label>
					<Input
						id="product-price"
						type="number"
						min="0"
						step="0.01"
						value={price}
						onChange={(event) => setPrice(event.target.value)}
						placeholder="0.00"
						disabled={saving}
					/>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						Precio actual: {currentPrice !== null ? formatMoney(currentPrice) : "No disponible"}.
					</p>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
						Cancelar
					</Button>
					<Button
						type="button"
						disabled={!canSave}
						onClick={() => {
							if (!product || !priceType || parsedPrice === null) return;
							onSave({ productId: product.id, tipoPrecio: priceType, precio: parsedPrice });
						}}
					>
						{saving ? "Guardando..." : "Guardar precio"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const ProductStockDialog: FC<{
	product: ProductoInventario | null;
	almacenes: Almacen[];
	stockItems: StockRegistro[];
	open: boolean;
	saving: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (payload: ProductStockUpdate) => void;
}> = ({ product, almacenes, stockItems, open, saving, onOpenChange, onSave }) => {
	const firstStock = stockItems[0] ?? null;
	const firstWarehouse = almacenes[0] ?? null;
	const [almacenId, setAlmacenId] = useState("");
	const [stockDisponible, setStockDisponible] = useState("");
	const [modoStock, setModoStock] = useState<StockRegistro["modoStock"]>("MANUAL");
	const parsedStock = parsePositiveNumber(stockDisponible);
	const selectedStock = useMemo(
		() => stockItems.find((item) => item.almacenId === almacenId) ?? null,
		[almacenId, stockItems],
	);
	const canSave = Boolean(product && almacenId && parsedStock !== null && !saving);

	useEffect(() => {
		if (!open) return;
		const initialStock = firstStock;
		const initialWarehouseId = initialStock?.almacenId ?? firstWarehouse?.id ?? "";
		setAlmacenId(initialWarehouseId);
		setStockDisponible(initialStock ? String(initialStock.stockDisponible) : "0");
		setModoStock(initialStock?.modoStock ?? "MANUAL");
	}, [firstStock, firstWarehouse, open]);

	useEffect(() => {
		if (!open || !selectedStock) return;
		setStockDisponible(String(selectedStock.stockDisponible));
		setModoStock(selectedStock.modoStock);
	}, [open, selectedStock]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
							<Boxes className="size-5" />
						</div>
						<div>
							<DialogTitle>Modificar inventario</DialogTitle>
							<DialogDescription>
								Actualiza la disponibilidad de {product?.nombre ?? "este producto"} por almacen.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2 sm:col-span-2">
						<Label>Almacen</Label>
						<Select value={almacenId} onValueChange={setAlmacenId} disabled={saving || almacenes.length === 0}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un almacen" />
							</SelectTrigger>
							<SelectContent>
								{almacenes.map((almacen) => (
									<SelectItem key={almacen.id} value={almacen.id}>
										{almacen.nombre}{almacen.principal ? " (principal)" : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="product-stock">Cantidad disponible</Label>
						<Input
							id="product-stock"
							type="number"
							min="0"
							step="0.01"
							value={stockDisponible}
							onChange={(event) => setStockDisponible(event.target.value)}
							placeholder="0"
							disabled={saving}
						/>
					</div>
					<div className="space-y-2">
						<Label>Modo</Label>
						<Select value={modoStock} onValueChange={(value: StockRegistro["modoStock"]) => setModoStock(value)} disabled={saving}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="MANUAL">Manual</SelectItem>
								<SelectItem value="ILIMITADO">Ilimitado</SelectItem>
								<SelectItem value="VINCULADO">Vinculado</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{almacenes.length === 0 && (
						<p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">
							No hay almacenes disponibles para registrar inventario.
						</p>
					)}
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
						Cancelar
					</Button>
					<Button
						type="button"
						disabled={!canSave}
						onClick={() => {
							if (!product || parsedStock === null) return;
							onSave({ productId: product.id, almacenId, stockDisponible: parsedStock, modoStock });
						}}
					>
						{saving ? "Guardando..." : "Guardar inventario"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
