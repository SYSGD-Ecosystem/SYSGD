import type { FC } from "react";
import { Boxes, CalendarDays, Package, ReceiptText, ShoppingCart, TrendingDown, TrendingUp, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CloudWorkspaceEntry } from "../../accounting/core/types/accountingTypes";
import { formatMoney } from "../accountingMath";
import { EmptyState } from "../components";
import { PosSummary } from "./PosSummary";
import { findProduct, formatStock, getVisibleStock, getWarehouseName } from "./posUtils";

type WorkspaceSectionProps = {
	workspace: CloudWorkspaceEntry;
};

const ProductCard: FC<{
	name: string;
	subtitle: string;
	price: number;
	badge: string;
}> = ({ name, subtitle, price, badge }) => (
	<Card className="rounded-lg shadow-sm">
		<CardContent className="p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="break-words font-semibold text-slate-950 dark:text-slate-50">{name}</p>
					<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
				</div>
				<Badge variant="outline">{badge}</Badge>
			</div>
			<p className="mt-4 text-lg font-semibold text-emerald-700 dark:text-emerald-300">{formatMoney(price)}</p>
		</CardContent>
	</Card>
);

export const SaleSection: FC<WorkspaceSectionProps> = ({ workspace }) => {
	const { inventario } = workspace.registro;
	const catalogItems = inventario.catalogoVentas
		.filter((item) => item.activo)
		.map((item) => ({ catalog: item, product: findProduct(workspace, item.productoId) }))
		.filter((item) => item.product);
	const sales = inventario.operaciones.filter((operation) => operation.tipo === "venta" && !operation.anulada);
	const salesTotal = sales.reduce((total, operation) => total + operation.total, 0);

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-3">
				<PosSummary title="Catalogo de ventas" value={String(catalogItems.length)} detail="Productos activos para vender" icon={<ShoppingCart />} />
				<PosSummary title="Ventas registradas" value={String(sales.length)} detail="Operaciones no anuladas" icon={<ReceiptText />} />
				<PosSummary title="Total vendido" value={formatMoney(salesTotal)} detail="Historico del espacio" icon={<TrendingUp />} />
			</div>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{catalogItems.map(({ catalog, product }) => (
					<ProductCard
						key={catalog.id}
						name={product?.nombre ?? catalog.productoId}
						subtitle={`${getWarehouseName(workspace, catalog.almacenId)} / ${product?.unidad || "unidad"}`}
						price={catalog.precioReferencia}
						badge="Venta"
					/>
				))}
			</div>
			{catalogItems.length === 0 && <EmptyState title="Sin productos de venta" description="No hay productos activos en el catalogo de ventas." icon={<ShoppingCart />} />}
		</div>
	);
};

export const PurchaseSection: FC<WorkspaceSectionProps> = ({ workspace }) => {
	const { inventario } = workspace.registro;
	const catalogItems = inventario.catalogoCompras
		.filter((item) => item.activo)
		.map((item) => ({ catalog: item, product: findProduct(workspace, item.productoId) }))
		.filter((item) => item.product);
	const purchases = inventario.operaciones.filter((operation) => operation.tipo === "compra" && !operation.anulada);
	const purchasesTotal = purchases.reduce((total, operation) => total + operation.total, 0);

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-3">
				<PosSummary title="Catalogo de compras" value={String(catalogItems.length)} detail="Insumos activos" icon={<Package />} />
				<PosSummary title="Compras registradas" value={String(purchases.length)} detail="Operaciones no anuladas" icon={<ReceiptText />} />
				<PosSummary title="Total comprado" value={formatMoney(purchasesTotal)} detail="Historico del espacio" icon={<TrendingDown />} />
			</div>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{catalogItems.map(({ catalog, product }) => (
					<ProductCard
						key={catalog.id}
						name={product?.nombre ?? catalog.productoId}
						subtitle={`${getWarehouseName(workspace, catalog.almacenDestinoId)} / ${product?.unidad || "unidad"}`}
						price={catalog.precioReferencia}
						badge="Compra"
					/>
				))}
			</div>
			{catalogItems.length === 0 && <EmptyState title="Sin insumos de compra" description="No hay productos activos en el catalogo de compras." icon={<Package />} />}
		</div>
	);
};

export const WarehouseSection: FC<WorkspaceSectionProps> = ({ workspace }) => {
	const { inventario } = workspace.registro;
	const visibleStock = getVisibleStock(inventario.stock);

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-3">
				<PosSummary title="Almacenes" value={String(inventario.almacenes.length)} detail="Espacios de inventario" icon={<Warehouse />} />
				<PosSummary title="Items en stock" value={String(visibleStock.length)} detail="Disponibles o visibles en venta" icon={<Boxes />} />
				<PosSummary title="Movimientos" value={String(inventario.movimientos.length)} detail="Entradas, salidas y ajustes" icon={<ReceiptText />} />
			</div>
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Stock por almacen</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] text-sm">
							<thead>
								<tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
									<th className="py-3 pr-4">Producto</th>
									<th className="py-3 pr-4">Almacen</th>
									<th className="py-3 pr-4">Modo</th>
									<th className="py-3 pr-4 text-right">Disponible</th>
								</tr>
							</thead>
							<tbody>
								{visibleStock.map((item) => {
									const product = findProduct(workspace, item.productoId);
									return (
										<tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/80">
											<td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">{product?.nombre ?? item.productoId}</td>
											<td className="py-3 pr-4">{getWarehouseName(workspace, item.almacenId)}</td>
											<td className="py-3 pr-4">{item.modoStock}</td>
											<td className="py-3 pr-4 text-right font-semibold">{formatStock(item)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export const HistorySection: FC<WorkspaceSectionProps> = ({ workspace }) => {
	const operations = [...workspace.registro.inventario.operaciones].reverse();
	const salesTotal = operations.filter((operation) => operation.tipo === "venta").reduce((total, operation) => total + operation.total, 0);
	const purchasesTotal = operations.filter((operation) => operation.tipo === "compra").reduce((total, operation) => total + operation.total, 0);

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-3">
				<PosSummary title="Operaciones" value={String(operations.length)} detail="Compras y ventas" icon={<ReceiptText />} />
				<PosSummary title="Ventas" value={formatMoney(salesTotal)} detail="Total historico" icon={<TrendingUp />} />
				<PosSummary title="Compras" value={formatMoney(purchasesTotal)} detail="Total historico" icon={<TrendingDown />} />
			</div>
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Historial reciente</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 p-4 pt-0">
					{operations.slice(0, 20).map((operation) => (
						<div key={operation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
							<div className="min-w-0">
								<p className="font-semibold text-slate-950 dark:text-slate-50">{operation.nombreProducto}</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{operation.fecha} {operation.hora} / {operation.cantidad} {operation.unidad}
								</p>
							</div>
							<div className="text-right">
								<Badge variant={operation.tipo === "venta" ? "default" : "secondary"}>{operation.tipo}</Badge>
								<p className="mt-1 font-semibold">{formatMoney(operation.total)}</p>
							</div>
						</div>
					))}
					{operations.length === 0 && <EmptyState title="Sin historial" description="No hay compras o ventas registradas." icon={<CalendarDays />} />}
				</CardContent>
			</Card>
		</div>
	);
};

export const MoreSection: FC<WorkspaceSectionProps> = ({ workspace }) => {
	const { inventario } = workspace.registro;
	const salesTotal = inventario.operaciones.filter((operation) => operation.tipo === "venta").reduce((total, operation) => total + operation.total, 0);
	const purchasesTotal = inventario.operaciones.filter((operation) => operation.tipo === "compra").reduce((total, operation) => total + operation.total, 0);
	const balance = salesTotal - purchasesTotal;

	return (
		<div className="grid gap-4 xl:grid-cols-2">
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Resumen rapido</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 p-4 pt-0 text-sm">
					<div className="flex justify-between gap-3"><span>Ventas</span><strong>{formatMoney(salesTotal)}</strong></div>
					<div className="flex justify-between gap-3"><span>Compras</span><strong>{formatMoney(purchasesTotal)}</strong></div>
					<div className="flex justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800"><span>Balance</span><strong>{formatMoney(balance)}</strong></div>
				</CardContent>
			</Card>
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4">
					<CardTitle className="text-base">Reportes y facturacion</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 p-4 pt-0 text-sm text-slate-600 dark:text-slate-300">
					<p>En Android esta seccion concentra datos de facturacion, reportes PDF y configuracion visual.</p>
					<p>En web queda preparada como visor de estado para abrir el modulo desde navegador sin perder la estructura de la app movil.</p>
				</CardContent>
			</Card>
		</div>
	);
};
