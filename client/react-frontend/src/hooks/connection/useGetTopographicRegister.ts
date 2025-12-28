import { useEffect, useState } from "react";
import type { TopographicRegisterData } from "../../types/TopographicRegister";

const useGetTopographicRegister = (entryId: string) => {
	const [topographic, setTopographic] = useState<
		TopographicRegisterData[] | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const fetchEntry = async () => {
			try {
				if (!entryId) {
					throw new Error("El ID no puede estar vacío.");
				}

				const response = await fetch(
					`${serverUrl}/api/get-document-topographic?id=${encodeURIComponent(entryId)}`,
					{ credentials: "include" },
				);

				if (!response.ok) {
					throw new Error("Error al obtener el registro topográfico");
				}

				const data = await response.json();
				// La API regresa [{ topographic_register: [...] }]
				const flat: TopographicRegisterData[] = Array.isArray(data)
					? data
							.filter((item) => Array.isArray(item.topographic_register))
							.flatMap((item) => item.topographic_register)
					: [];
				setTopographic(flat);
				setError(null);
			} catch (err: any) {
				console.error(err);
				setError(err.message || "Error desconocido");
			} finally {
				setLoading(false);
			}
		};

		fetchEntry();
	}, [entryId, serverUrl]);

	return { topographic, error, loading };
};

export default useGetTopographicRegister;
