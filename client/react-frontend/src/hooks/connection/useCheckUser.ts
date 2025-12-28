import { useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

interface CheckUserResponse {
	exists: boolean;
	id?: string;
	status?: "active" | "invited" | "suspended" | "banned";
	hasPassword?: boolean;
	privileges?: string;
}

export function useCheckUser() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [data, setData] = useState<CheckUserResponse | null>(null);

	const checkUser = async (email: string) => {
		setLoading(true);
		setError("");
		setData(null);
		try {
			const res = await fetch(`${serverUrl}/api/auth/check-user`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
				credentials: "include",
			});
			if (!res.ok) {
				if (res.status === 404) {
					setData({ exists: false });
					return;
				}
				throw new Error("Error en verificación");
			}
			const json = await res.json();
			setData(json as CheckUserResponse);
		} catch (e) {
			setError("No se pudo verificar el usuario");
		} finally {
			setLoading(false);
		}
	};

	return { checkUser, data, loading, error };
}
