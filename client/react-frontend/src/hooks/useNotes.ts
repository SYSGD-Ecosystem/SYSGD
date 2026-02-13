import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { CreateNoteData, ProjectNote, UpdateNoteData } from "@/types/Note";

interface UseNotesResult {
	notes: ProjectNote[];
	loading: boolean;
	error: string | null;
	fetchNotes: () => Promise<void>;
	createNote: (data: CreateNoteData) => Promise<ProjectNote | null>;
	updateNote: (id: string, data: UpdateNoteData) => Promise<ProjectNote | null>;
	deleteNote: (id: string) => Promise<boolean>;
	refreshNotes: () => Promise<void>;
}

export const useNotes = (projectId: number | string): UseNotesResult => {
	const [notes, setNotes] = useState<ProjectNote[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);


	// Función para obtener todas las notas del proyecto
	const fetchNotes = useCallback(async (): Promise<void> => {
		if (projectId === null || projectId === undefined) {
			setError("No projectId provided");
			setNotes([]);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await api.get(`/api/projects/${projectId}/notes`);
			const result = response.data;
			if (!result || typeof result !== "object" || !("data" in result)) {
				setError('Respuesta de la API inválida: falta la propiedad "data"');
				setNotes([]);
				return;
			}
			setNotes(result.data || []);
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Error desconocido al cargar las notas";
			setError(errorMessage);
			console.error("Error fetching notes:", err);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	// Función para crear una nueva nota
	const createNote = async (
		data: CreateNoteData,
	): Promise<ProjectNote | null> => {
		if (projectId === null || projectId === undefined) {
			setError("No projectId provided");
			return null;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await api.post(`/api/projects/${projectId}/notes`, data);
			const result = response.data;
			const newNote = result.data;

			// Agregar la nueva nota al estado local
			setNotes((prevNotes) => [newNote, ...prevNotes]);

			return newNote;
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Error desconocido al crear la nota";
			setError(errorMessage);
			console.error("Error creating note:", err);
			return null;
		} finally {
			setLoading(false);
		}
	};

	// Función para actualizar una nota
	const updateNote = async (
		id: string,
		data: UpdateNoteData,
	): Promise<ProjectNote | null> => {
		setLoading(true);
		setError(null);

		try {
			const response = await api.put(`/api/notes/${id}`, data);
			const result = response.data;
			const updatedNote = result.data;

			// Actualizar la nota en el estado local
			setNotes((prevNotes) =>
				prevNotes.map((note) => (note.id === id ? updatedNote : note)),
			);

			return updatedNote;
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Error desconocido al actualizar la nota";
			setError(errorMessage);
			console.error("Error updating note:", err);
			return null;
		} finally {
			setLoading(false);
		}
	};

	// Función para eliminar una nota
	const deleteNote = async (id: string): Promise<boolean> => {
		setLoading(true);
		setError(null);

		try {
			await api.delete(`/api/notes/${id}`);

			// Eliminar la nota del estado local
			setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

			return true;
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Error desconocido al eliminar la nota";
			setError(errorMessage);
			console.error("Error deleting note:", err);
			return false;
		} finally {
			setLoading(false);
		}
	};

	// Función auxiliar para refrescar las notas
	const refreshNotes = async (): Promise<void> => {
		await fetchNotes();
	};

	// Cargar las notas al montar el componente o cuando cambie el projectId
	useEffect(() => {
		if (projectId !== null && projectId !== undefined) {
			fetchNotes();
		}
	}, [projectId, fetchNotes]);

	return {
		notes,
		loading,
		error,
		fetchNotes,
		createNote,
		updateNote,
		deleteNote,
		refreshNotes,
	};
};
