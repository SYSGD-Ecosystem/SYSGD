import { useCallback, useEffect, useState } from "react";
import type { PublicUser } from "../../types/user";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

interface UsePublicUsersReturn {
	publicUsers: PublicUser[];
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

export function usePublicUsers(): UsePublicUsersReturn {
	const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// obtener usuarios públicos
	const fetchPublicUsers = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch(`${serverUrl}/api/users/public-users`, {
				credentials: "include",
			});

			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || "Error al obtener usuarios públicos");
			}

			const data = await res.json();

			// 🔄 Conversión a la estructura esperada
			const parsedUsers: PublicUser[] = data.map((user: any, index: number) => {
				const initials = user.name
					?.split(" ")
					.map((w: string) => w[0])
					.join("")
					.toUpperCase();

				return {
					id: `u${user.id || index + 1}`,
					name: user.name || "Usuario desconocido",
					email: user.email || "sin-correo@example.com",
					type: "user",
					avatar: initials || "👤",
					online: true,
					isPublic: true,
				};
			});

			setPublicUsers(parsedUsers);
		} catch (err: any) {
			setError(err.message || "Error desconocido");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPublicUsers();
	}, [fetchPublicUsers]);

	return {
		publicUsers,
		loading,
		error,
		refetch: fetchPublicUsers,
	};
}
