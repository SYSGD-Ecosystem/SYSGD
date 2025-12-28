import { useCallback, useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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

	// Obtener todos los archivos
	const fetchArchives = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${serverUrl}/api/archives`, {
				credentials: "include",
			});
			if (!res.ok) throw new Error("Error al obtener archivos");
			const data = await res.json();
			setArchives(data);
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (e: any) {
			setError(e.message || "Error desconocido");
		} finally {
			setLoading(false);
		}
	}, []);

	// Crear un nuevo archivo
	const createArchive = useCallback(
		async (archive: Omit<Archive, "id">) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${serverUrl}/api/create`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(archive),
				});
				if (!res.ok) throw new Error("Error al crear archivo");
				await fetchArchives();
				return true;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (e: any) {
				setError(e.message || "Error desconocido");
				return false;
			} finally {
				setLoading(false);
			}
		},
		[fetchArchives],
	);

	// Actualizar un archivo
	const updateArchive = useCallback(
		async (id: number, data: Partial<Omit<Archive, "id">>) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${serverUrl}/api/archives/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(data),
				});
				if (!res.ok) throw new Error("Error al actualizar archivo");
				await fetchArchives();
				return true;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (e: any) {
				setError(e.message || "Error desconocido");
				return false;
			} finally {
				setLoading(false);
			}
		},
		[fetchArchives],
	);

	// Eliminar un archivo
	const deleteArchive = useCallback(
		async (id: string) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${serverUrl}/api/archives/${id}`, {
					method: "DELETE",
					credentials: "include",
				});
				if (!res.ok) throw new Error("Error al eliminar archivo");
				await fetchArchives();
				return true;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (e: any) {
				setError(e.message || "Error desconocido");
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
