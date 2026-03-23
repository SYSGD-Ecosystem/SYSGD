import api from "@/lib/api";
import type { UserData } from "@/types/user";
import { useEffect, useState } from "react";

const useBillingData = () => {
	const [billing, setBilling] = useState<UserData["billing"] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchBillingData = async () => {
			setLoading(true);
			try {
				const userBillingData = await api.get<UserData>("/api/users/data");
				setBilling(userBillingData.data.billing);
			} catch (error) {
				console.error("Error fetching billing data:", error);
				setBilling(null);
			} finally {
				setLoading(false);
			}
		};
		fetchBillingData();
	}, []);

	return { billing, loading };
};

export default useBillingData;
