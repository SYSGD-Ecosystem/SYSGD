import { useCallback, useState } from "react";
import api from "@/lib/api";

export interface Archive {
	id: string;
	code: string;
	company: string;
	name: string;
}

export function useArchivesApi() {
	const [archives, setArchives] = useState<Archive[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Listar: La base del Dropdown en el WorkSpace
	const fetchArchives = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.get<Archive[]>("/api/archives");
			setArchives(res.data || []);
		} catch (e: any) {
			setError(e.response?.data?.message || "Error al obtener archivos");
		} finally {
			setLoading(false);
		}
	}, []);

	// Crear: Aquí es donde entrará la validación de licencias para MIPYMES
	const createArchive = useCallback(
		async (archive: Omit<Archive, "id">) => {
			setLoading(true);
			setError(null);
			try {
				// En el futuro, este endpoint verificará si la MIPYME
				// tiene cupo en su suscripción para crear un nuevo libro/archivo
				await api.post("/api/create", archive);
				await fetchArchives();
				return true;
			} catch (e: any) {
				const msg = e.response?.data?.message || "Error al crear archivo";
				setError(msg);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[fetchArchives],
	);

	// Actualizar: Vital para corregir Nombres o Códigos de entidad
	const updateArchive = useCallback(
		async (id: string | number, data: Partial<Omit<Archive, "id">>) => {
			setLoading(true);
			setError(null);
			try {
				await api.put(`/api/archives/${id}`, data);
				await fetchArchives();
				return true;
			} catch (e: any) {
				setError(e.response?.data?.message || "Error al actualizar archivo");
				return false;
			} finally {
				setLoading(false);
			}
		},
		[fetchArchives],
	);

	// Eliminar: La acción más crítica
	const deleteArchive = useCallback(
		async (id: string) => {
			if (!id) return false;
			setLoading(true);
			setError(null);
			try {
				await api.delete(`/api/archives/${id}`);
				await fetchArchives();
				return true;
			} catch (e: any) {
				setError(e.response?.data?.message || "Error al eliminar archivo");
				return false;
			} finally {
				setLoading(false);
			}
		},
		[fetchArchives],
	);

	return {
		archives,
		loading,
		error,
		fetchArchives,
		createArchive,
		updateArchive,
		deleteArchive,
	};
}
