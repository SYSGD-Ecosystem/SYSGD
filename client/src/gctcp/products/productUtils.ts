import type { CloudWorkspaceEntry, ProductoInventario, StockRegistro } from "../../accounting/core/types/accountingTypes";
import { formatMoney } from "../accountingMath";

export type ProductUsage = {
	canDelete: boolean;
	labels: string[];
};

export type ProductAvailability = {
	label: string;
	detail: string;
};

export type ProductPricing = {
	salePrice: string;
	purchasePrice: string;
	salePriceValue: number | null;
	purchasePriceValue: number | null;
};

export type ProductAvailabilityItem = {
	stock: StockRegistro;
	warehouseName: string;
	quantityLabel: string;
};

const containsProductId = (value: unknown, productId: string): boolean => {
	if (typeof value === "string") {
		if (value === productId) return true;
		const trimmed = value.trim();
		if ((trimmed.startsWith("[") || trimmed.startsWith("{")) && trimmed.includes(productId)) {
			try {
				return containsProductId(JSON.parse(trimmed), productId);
			} catch {
				return false;
			}
		}
		return false;
	}
	if (Array.isArray(value)) return value.some((item) => containsProductId(item, productId));
	if (value && typeof value === "object") {
		return Object.values(value as Record<string, unknown>).some((item) => containsProductId(item, productId));
	}
	return false;
};

export const getProductUsage = (workspace: CloudWorkspaceEntry, productId: string): ProductUsage => {
	const { inventario } = workspace.registro;
	const labels: string[] = [];

	if (inventario.catalogoVentas.some((item) => item.productoId === productId)) labels.push("ventas");
	if (inventario.catalogoCompras.some((item) => item.productoId === productId)) labels.push("compras");
	if (inventario.stock.some((item) => item.productoId === productId)) labels.push("almacen");
	if (inventario.movimientos.some((item) => item.productoId === productId)) labels.push("movimientos");
	if (inventario.operaciones.some((item) => item.productoId === productId)) labels.push("operaciones");
	if (inventario.historialPrecios.some((item) => item.productoId === productId)) labels.push("precios");
	if (inventario.vinculos.some((item) => containsProductId(item, productId))) labels.push("vinculos");

	return {
		canDelete: labels.length === 0,
		labels,
	};
};

export const getProductStockItems = (workspace: CloudWorkspaceEntry, productId: string): ProductAvailabilityItem[] => {
	const { inventario } = workspace.registro;
	return inventario.stock
		.filter((item) => item.productoId === productId)
		.map((stock) => ({
			stock,
			warehouseName: inventario.almacenes.find((almacen) => almacen.id === stock.almacenId)?.nombre ?? stock.almacenId,
			quantityLabel: stock.modoStock === "ILIMITADO"
				? "Ilimitado"
				: stock.stockDisponible.toLocaleString("es-CU", { maximumFractionDigits: 2 }),
		}));
};

export const getProductAvailability = (workspace: CloudWorkspaceEntry, productId: string): ProductAvailability => {
	const stockItems = workspace.registro.inventario.stock.filter((item) => item.productoId === productId);
	if (stockItems.length === 0) {
		return { label: "Sin stock", detail: "No hay disponibilidad registrada" };
	}
	if (stockItems.some((item) => item.modoStock === "ILIMITADO")) {
		return { label: "Ilimitado", detail: `${stockItems.length} almacen(es)` };
	}

	const total = stockItems.reduce((sum, item) => sum + (Number.isFinite(item.stockDisponible) ? item.stockDisponible : 0), 0);
	return {
		label: total.toLocaleString("es-CU", { maximumFractionDigits: 2 }),
		detail: `${stockItems.length} almacen(es) con stock`,
	};
};

const getPriceSummary = (prices: number[]): { label: string; value: number | null } => {
	const validPrices = prices.filter((price) => Number.isFinite(price));
	if (validPrices.length === 0) return { label: "No disponible", value: null };
	const min = Math.min(...validPrices);
	const max = Math.max(...validPrices);
	return {
		label: min === max ? formatMoney(min) : `${formatMoney(min)} - ${formatMoney(max)}`,
		value: validPrices[validPrices.length - 1] ?? null,
	};
};

export const getProductPricing = (workspace: CloudWorkspaceEntry, productId: string): ProductPricing => {
	const { inventario } = workspace.registro;
	const saleCatalogPrices = inventario.catalogoVentas
		.filter((item) => item.productoId === productId && item.activo)
		.map((item) => item.precioReferencia);
	const purchaseCatalogPrices = inventario.catalogoCompras
		.filter((item) => item.productoId === productId && item.activo)
		.map((item) => item.precioReferencia);
	const saleHistoryPrices = inventario.historialPrecios
		.filter((item) => item.productoId === productId && item.tipoPrecio === "VENTA" && item.activo)
		.map((item) => item.precio);
	const purchaseHistoryPrices = inventario.historialPrecios
		.filter((item) => item.productoId === productId && item.tipoPrecio === "COMPRA" && item.activo)
		.map((item) => item.precio);
	const salePrice = getPriceSummary(saleCatalogPrices.length > 0 ? saleCatalogPrices : saleHistoryPrices);
	const purchasePrice = getPriceSummary(purchaseCatalogPrices.length > 0 ? purchaseCatalogPrices : purchaseHistoryPrices);
	return {
		salePrice: salePrice.label,
		purchasePrice: purchasePrice.label,
		salePriceValue: salePrice.value,
		purchasePriceValue: purchasePrice.value,
	};
};

export const getProductSubtitle = (product: ProductoInventario): string =>
	product.descripcion || product.tipo || product.unidad || "Sin descripcion";
