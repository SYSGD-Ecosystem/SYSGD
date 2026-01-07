import type { FC } from "react";
import type { Order } from "./CryptoPurchase";
import OrderCard from "./components/OrderCard";

// src/components/billing/PurchaseOrders.tsx
const PurchaseOrders: FC<{
	orders: Order[];
	loadOrders: () => Promise<void>;
}> = ({ orders, loadOrders }) => {
	loadOrders();

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold">Historial de Transacciones</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{orders.map((order) => (
					<OrderCard
						key={order.order_id}
						order={order}
						loadOrders={loadOrders}
					/>
				))}
			</div>
		</div>
	);
};

export default PurchaseOrders;
