/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api"; // Instancia centralizada de Axios
import type { Task } from "@/types/Task";

export const useTasks = (projectId: string) => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Obtener tareas
	const fetchData = useCallback(async () => {
		if (!projectId) return;

		try {
			setLoading(true);
			const res = await api.get<Task[]>(`/api/tasks/${projectId}`);
			setTasks(res.data);
			setError(null);
		} catch (err: any) {
			console.error("Error al cargar tareas:", err);
			setError(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Crear tarea
	const createTask = async (task: Partial<Task>) => {
		try {
			const taskPayload = {
				...task,
				project_id: projectId, // Inyectamos el ID del proyecto directamente
				assignees: task.assignees?.map((a) => a.id) || [],
			};

			const res = await api.post<Task>("/api/tasks", taskPayload);

			// Optimistic update: Agregamos la tarea al estado local
			setTasks((prev) => [...prev, res.data]);
			return true;
		} catch (err) {
			console.error("Error creando tarea:", err);
			return false;
		}
	};

	// Actualizar tarea
	const updateTask = async (taskId: string, taskData: Partial<Task>) => {
		try {
			const taskPayload = {
				...taskData,
				assignees: taskData.assignees?.map((a) => a.id) || [],
			};

			await api.put(`/api/tasks/${taskId}`, taskPayload);

			// En lugar de refrescar todo, podrías actualizar solo la tarea en el estado
			setTasks((prev) =>
				prev.map((t) => (t.id === taskId ? { ...t, ...taskData } : t)),
			);
			return true;
		} catch (err) {
			console.error("Error actualizando tarea:", err);
			return false;
		}
	};

	// Eliminar tarea
	const deleteTask = async (taskId: string) => {
		try {
			await api.delete(`/api/tasks/${taskId}`);

			// Filtrado local instantáneo
			setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
			return true;
		} catch (err) {
			console.error("Error eliminando tarea:", err);
			return false;
		}
	};

	return {
		tasks,
		loading,
		error,
		fetchData,
		createTask,
		updateTask,
		deleteTask,
	};
};
