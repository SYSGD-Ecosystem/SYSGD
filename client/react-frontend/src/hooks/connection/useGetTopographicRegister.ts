import { useEffect, useState } from "react";
import api from "@/lib/api"; // Tu instancia centralizada
import type { TopographicRegisterData } from "../../types/TopographicRegister";

interface TopographicResponse {
	topographic_register: TopographicRegisterData[];
	[key: string]: any;
}

const useGetTopographicRegister = (entryId: string) => {
	// Inicializamos con array vacío para que el .map() de la tabla no falle
	const [topographic, setTopographic] = useState<TopographicRegisterData[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!entryId) {
			setTopographic([]);
			setLoading(false);
			return;
		}

		const fetchTopographic = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await api.get<TopographicResponse[]>(
					"/api/get-document-topographic",
					{
						params: { id: entryId },
					},
				);

				// Mantenemos tu lógica de flatMap para extraer los datos del JSONB
				const flatData = Array.isArray(response.data)
					? response.data
							.filter((item) => Array.isArray(item.topographic_register))
							.flatMap((item) => item.topographic_register)
					: [];

				setTopographic(flatData);
			} catch (err: any) {
				console.error("Error cargando registro topográfico:", err);
				setError(
					err.response?.data?.message ||
						"Error al obtener el registro topográfico",
				);
				setTopographic([]);
			} finally {
				setLoading(false);
			}
		};

		fetchTopographic();
	}, [entryId]);

	return { topographic, error, loading };
};

export default useGetTopographicRegister;
