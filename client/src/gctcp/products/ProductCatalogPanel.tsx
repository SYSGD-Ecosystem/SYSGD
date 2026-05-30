import { type FC, useMemo, useState } from "react";
import { Boxes, Pencil, ShoppingBag, ShoppingCart, Trash2, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CloudWorkspaceEntry, ProductoInventario } from "../../accounting/core/types/accountingTypes";
import { EmptyState } from "../components";
import { DeleteProductDialog } from "./DeleteProductDialog";
import {
	ProductPriceDialog,
	ProductStockDialog,
	type ProductPriceType,
	type ProductPriceUpdate,
	type ProductStockUpdate,
} from "./ProductEditDialogs";
import {
	getProductAvailability,
	getProductPricing,
	getProductStockItems,
	getProductSubtitle,
	getProductUsage,
} from "./productUtils";

export const ProductCatalogPanel: FC<{
	workspace: CloudWorkspaceEntry;
	deletingProduct: boolean;
	savingProductChanges: boolean;
	onDeleteProduct: (productId: string) => void;
	onUpdateProductPrice: (payload: ProductPriceUpdate) => void;
	onUpdateProductStock: (payload: ProductStockUpdate) => void;
}> = ({ workspace, deletingProduct, savingProductChanges, onDeleteProduct, onUpdateProductPrice, onUpdateProductStock }) => {
	const productos = workspace.registro.inventario.productos;
	const [productToDelete, setProductToDelete] = useState<ProductoInventario | null>(null);
	const [priceEditor, setPriceEditor] = useState<{ product: ProductoInventario; priceType: ProductPriceType; currentPrice: number | null } | null>(null);
	const [stockEditorProduct, setStockEditorProduct] = useState<ProductoInventario | null>(null);
	const selectedUsage = useMemo(
		() => productToDelete ? getProductUsage(workspace, productToDelete.id) : null,
		[productToDelete, workspace],
	);

	return (
		<Card className="rounded-lg shadow-sm">

			<ProductPriceDialog
				product={priceEditor?.product ?? null}
				priceType={priceEditor?.priceType ?? null}
				currentPrice={priceEditor?.currentPrice ?? null}
				open={Boolean(priceEditor)}
				saving={savingProductChanges}
				onOpenChange={(open) => {
					if (!open && !savingProductChanges) setPriceEditor(null);
				}}
				onSave={(payload) => {
					onUpdateProductPrice(payload);
					setPriceEditor(null);
				}}
			/>
			<ProductStockDialog
				product={stockEditorProduct}
				almacenes={workspace.registro.inventario.almacenes}
				stockItems={stockEditorProduct ? workspace.registro.inventario.stock.filter((item) => item.productoId === stockEditorProduct.id) : []}
				open={Boolean(stockEditorProduct)}
				saving={savingProductChanges}
				onOpenChange={(open) => {
					if (!open && !savingProductChanges) setStockEditorProduct(null);
				}}
				onSave={(payload) => {
					onUpdateProductStock(payload);
					setStockEditorProduct(null);
				}}
			/>
			<DeleteProductDialog
				product={productToDelete}
				open={Boolean(productToDelete)}
				deleting={deletingProduct}
				onOpenChange={(open) => {
					if (!open && !deletingProduct) setProductToDelete(null);
				}}
				onConfirm={() => {
					if (!productToDelete || !selectedUsage?.canDelete) return;
					onDeleteProduct(productToDelete.id);
					setProductToDelete(null);
				}}
			/>
			<CardHeader className="p-4">
				<CardTitle className="text-base">Productos</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				{productos.map((product) => {
					const usage = getProductUsage(workspace, product.id);
					const availability = getProductAvailability(workspace, product.id);
					const pricing = getProductPricing(workspace, product.id);
					const stockDetails = getProductStockItems(workspace, product.id);

					return (
						<div key={product.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="break-words font-medium text-slate-950 dark:text-slate-50">{product.nombre}</p>
									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getProductSubtitle(product)}</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
									disabled={!usage.canDelete || deletingProduct}
									onClick={() => setProductToDelete(product)}
									title={usage.canDelete ? "Eliminar producto" : `Producto en uso: ${usage.labels.join(", ")}`}
								>
									<Trash2 className="size-4" />
									Eliminar
								</Button>
							</div>

							<div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
								<div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
									<div className="flex items-center justify-between gap-2 text-xs uppercase text-slate-500 dark:text-slate-400">
										<span className="flex items-center gap-2">
											<Warehouse className="size-3.5" />
											Disponibilidad
										</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-7 px-2 text-xs"
											disabled={savingProductChanges}
											onClick={() => setStockEditorProduct(product)}
										>
											<Pencil className="size-3.5" />
											Modificar
										</Button>
									</div>
									<p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{availability.label}</p>
									<p className="text-xs text-slate-500 dark:text-slate-400">{availability.detail}</p>
									{stockDetails.length > 0 && (
										<div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs dark:border-slate-700">
											{stockDetails.map((item) => (
												<div key={item.stock.id} className="flex items-center justify-between gap-2">
													<span className="break-words text-slate-600 dark:text-slate-300">{item.warehouseName}</span>
													<span className="shrink-0 font-medium text-slate-950 dark:text-slate-50">{item.quantityLabel}</span>
												</div>
											))}
										</div>
									)}
								</div>
								<div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
									<div className="flex items-center justify-between gap-2 text-xs uppercase text-slate-500 dark:text-slate-400">
										<span className="flex items-center gap-2"><ShoppingCart className="size-3.5" />Precio venta</span>
										<Button type="button" variant="ghost" size="icon" className="size-7" disabled={savingProductChanges} onClick={() => setPriceEditor({ product, priceType: "VENTA", currentPrice: pricing.salePriceValue })} title="Editar precio de venta">
											<Pencil className="size-3.5" />
										</Button>
									</div>
									<p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{pricing.salePrice}</p>
								</div>
								<div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
									<div className="flex items-center justify-between gap-2 text-xs uppercase text-slate-500 dark:text-slate-400">
										<span className="flex items-center gap-2"><ShoppingBag className="size-3.5" />Precio compra</span>
										<Button type="button" variant="ghost" size="icon" className="size-7" disabled={savingProductChanges} onClick={() => setPriceEditor({ product, priceType: "COMPRA", currentPrice: pricing.purchasePriceValue })} title="Editar precio de compra">
											<Pencil className="size-3.5" />
										</Button>
									</div>
									<p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{pricing.purchasePrice}</p>
								</div>
							</div>

							<div className="mt-3 flex flex-wrap gap-2">
								{usage.canDelete ? (
									<Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Disponible para eliminar</Badge>
								) : (
									usage.labels.map((label) => (
										<Badge key={label} variant="secondary">En {label}</Badge>
									))
								)}
							</div>
						</div>
					);
				})}
				{productos.length === 0 && <EmptyState title="Sin productos" description="No hay productos disponibles para mostrar." icon={<Boxes />} />}
			</CardContent>
		</Card>
	);
};
