// src/hooks/connection/useAuthSession.ts
import { useEffect, useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export function useAuthSession() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<null | {
		id: number;
		username: string;
		name: string;
		privileges: string;
	}>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		const checkSession = async () => {
			try {
				const res = await fetch(`${serverUrl}/api/me`, {
					method: "GET",
					credentials: "include",
				});

				if (!res.ok) throw new Error("No logeado");
				const data = await res.json();
				setUser(data);
			} catch (err) {
				setError("No autorizado");
			} finally {
				setLoading(false);
			}
		};

		checkSession();
	}, []);

	return { user, loading, error };
}
