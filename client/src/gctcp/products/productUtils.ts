import type { CloudWorkspaceEntry, ProductoInventario } from "../../accounting/core/types/accountingTypes";
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

const summarizePrices = (prices: number[]): string => {
	const validPrices = prices.filter((price) => Number.isFinite(price));
	if (validPrices.length === 0) return "No disponible";
	const min = Math.min(...validPrices);
	const max = Math.max(...validPrices);
	if (min === max) return formatMoney(min);
	return `${formatMoney(min)} - ${formatMoney(max)}`;
};

export const getProductPricing = (workspace: CloudWorkspaceEntry, productId: string): ProductPricing => {
	const { inventario } = workspace.registro;
	return {
		salePrice: summarizePrices(
			inventario.catalogoVentas
				.filter((item) => item.productoId === productId && item.activo)
				.map((item) => item.precioReferencia),
		),
		purchasePrice: summarizePrices(
			inventario.catalogoCompras
				.filter((item) => item.productoId === productId && item.activo)
				.map((item) => item.precioReferencia),
		),
	};
};

export const getProductSubtitle = (product: ProductoInventario): string =>
	product.descripcion || product.tipo || product.unidad || "Sin descripcion";
