import api from "@/lib/api";
import { useState } from "react";
import type { Order } from "../CryptoPurchase";

const useOrders = (address?: string | null) => {
	const [orders, setOrders] = useState<Order[]>([]);

	const loadOrders = async () => {
		try {
			const response = await api.get("/api/crypto-payments/orders", {
				params: { walletAddress: address },
			});
			setOrders(response.data);
		} catch (error) {
			console.error("Error loading orders:", error);
			return [];
		}
	};

	return { orders, loadOrders };
};

export default useOrders;
