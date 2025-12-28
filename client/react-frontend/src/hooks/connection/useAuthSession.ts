import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { User } from "@/types/user";

export function useAuthSession() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		const checkSession = async () => {
			try {
				const res = await api.get<User>("/api/auth/me");
				setUser(res.data);
			} catch {
				setError("No autorizado");
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	return { user, loading, error };
}
