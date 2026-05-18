import type { CloudWorkspaceEntry, ProductoInventario, StockRegistro } from "../../accounting/core/types/accountingTypes";

export const findProduct = (workspace: CloudWorkspaceEntry, productId: string): ProductoInventario | null =>
	workspace.registro.inventario.productos.find((product) => product.id === productId) ?? null;

export const getWarehouseName = (workspace: CloudWorkspaceEntry, warehouseId: string | null): string => {
	if (!warehouseId) return "Sin almacen";
	return workspace.registro.inventario.almacenes.find((warehouse) => warehouse.id === warehouseId)?.nombre ?? warehouseId;
};

export const getVisibleStock = (stock: StockRegistro[]): StockRegistro[] =>
	stock.filter((item) => item.visibleEnVentas || item.stockDisponible > 0 || item.modoStock === "ILIMITADO");

export const formatStock = (item: StockRegistro): string => {
	if (item.modoStock === "ILIMITADO") return "Ilimitado";
	if (!Number.isFinite(item.stockDisponible)) return "Sin dato";
	return item.stockDisponible.toLocaleString("es-CU", { maximumFractionDigits: 2 });
};
