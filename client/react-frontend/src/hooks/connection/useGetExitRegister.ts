import { useEffect, useState } from "react";
import api from "@/lib/api"; // Tu instancia centralizada de Axios
import { ExitRegisterData } from "@/components/docs/ExitRegister";

// Definimos la estructura de la respuesta para mantener coherencia con el componente
interface ExitResponse {
	exit_register: ExitRegisterData[];
	[key: string]: any;
}

export function useGetExitRegister(entryId: string) {
	// Inicializamos con un array vacío para que el componente no falle al renderizar
	const [exit, setExit] = useState<ExitResponse[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Si no hay ID, evitamos la petición y limpiamos el estado
		if (!entryId) {
			setExit([]);
			setLoading(false);
			return;
		}

		const fetchExit = async () => {
			setLoading(true);
			setError(null);
			try {
				// Axios gestiona automáticamente los params y las credenciales
				const response = await api.get<ExitResponse[]>(
					"/api/get-document-exit",
					{
						params: { id: entryId },
					},
				);

				// Garantizamos que siempre devolvemos un array, incluso si la data es null
				setExit(response.data || []);
			} catch (err: any) {
				console.error("Error en useGetExitRegister:", err);
				setError(
					err.response?.data?.message ||
						"Error al obtener el registro de salida",
				);
				setExit([]); // En caso de error, mantenemos el array vacío para seguridad de la UI
			} finally {
				setLoading(false);
			}
		};

		fetchExit();
	}, [entryId]);

	return { exit, error, loading };
}

export default useGetExitRegister;
