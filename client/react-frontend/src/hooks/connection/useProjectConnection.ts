import { AxiosError } from "axios";
import api from "@/lib/api";

type ProjectData = {
	name: string;
	description: string;
	status?: string;
	visibility?: string;
};

type ApiErrorResponse = {
	message?: string;
	error?: string;
	errors?: Record<string, string[]>;
};

type useProjectConnectionReturnType = {
	handleCreateProject: (
		name: string,
		description: string,
		onSuccess: () => void,
		onFail: (error?: string) => void,
	) => Promise<void>;
	handleUpdateProject: (
		id: string,
		data: Partial<ProjectData>,
		onSuccess: () => void,
		onFail: (error?: string) => void,
	) => Promise<void>;
	handleDeleteProject: (
		id: string,
		onSuccess: () => void,
		onFail: (error?: string) => void,
	) => Promise<void>;
};

// Helper function para manejar errores de Axios
const getErrorMessage = (error: unknown): string => {
	if (error instanceof AxiosError) {
		const errorData = error.response?.data as ApiErrorResponse | undefined;

		if (errorData?.message) return errorData.message;
		if (errorData?.error) return errorData.error;
		if (errorData?.errors) {
			// Concatena todos los errores de validación
			return Object.values(errorData.errors).flat().join(", ");
		}

		// Mensajes por código de estado
		switch (error.response?.status) {
			case 401:
				return "No autorizado. Por favor, inicia sesión nuevamente.";
			case 403:
				return "No tienes permisos para realizar esta acción.";
			case 404:
				return "Recurso no encontrado.";
			case 409:
				return "Ya existe un proyecto con ese nombre.";
			case 422:
				return "Datos inválidos. Por favor, revisa la información.";
			case 500:
				return "Error interno del servidor. Por favor, intenta más tarde.";
			default:
				return error.message || "Error desconocido";
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Error desconocido";
};

const useProjectConnection = (): useProjectConnectionReturnType => {
	const handleCreateProject = async (
		name: string,
		description: string,
		onSuccess: () => void,
		onFail: (error?: string) => void,
	) => {
		try {
			await api.post("/api/projects", { name, description });
			onSuccess();
		} catch (error: unknown) {
			console.error("Error al crear proyecto:", error);
			const errorMessage = getErrorMessage(error);
			onFail(errorMessage);
		}
	};

	const handleUpdateProject = async (
		id: string,
		data: Partial<ProjectData>,
		onSuccess: () => void,
		onFail: (error?: string) => void,
	) => {
		try {
			await api.put(`/api/projects/${id}`, data);
			onSuccess();
		} catch (error: unknown) {
			console.error("Error al actualizar proyecto:", error);
			const errorMessage = getErrorMessage(error);
			onFail(errorMessage);
		}
	};

	const handleDeleteProject = async (
		id: string,
		onSuccess: () => void,
		onFail: (error?: string) => void,
	) => {
		try {
			await api.delete(`/api/projects/${id}`);
			onSuccess();
		} catch (error: unknown) {
			console.error("Error al eliminar proyecto:", error);
			const errorMessage = getErrorMessage(error);
			onFail(errorMessage);
		}
	};

	return {
		handleCreateProject,
		handleUpdateProject,
		handleDeleteProject,
	};
};

export default useProjectConnection;
