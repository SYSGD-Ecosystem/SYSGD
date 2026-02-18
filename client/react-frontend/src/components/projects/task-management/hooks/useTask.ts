import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api"; // Instancia centralizada de Axios
import type { Task } from "@/types/Task";

interface TaskCachePayload {
	tasks: Task[];
	updatedAt: number;
}

const getCacheKey = (projectId: string) => `tasks-cache:${projectId}`;

const readTasksCache = (projectId: string): Task[] => {
	if (!projectId) return [];
	try {
		const raw = localStorage.getItem(getCacheKey(projectId));
		if (!raw) return [];
		const parsed = JSON.parse(raw) as TaskCachePayload;
		if (!parsed || !Array.isArray(parsed.tasks)) return [];
		return parsed.tasks;
	} catch {
		return [];
	}
};

const writeTasksCache = (projectId: string, tasks: Task[]) => {
	if (!projectId) return;
	const payload: TaskCachePayload = { tasks, updatedAt: Date.now() };
	localStorage.setItem(getCacheKey(projectId), JSON.stringify(payload));
};

const normalizeTasksForCompare = (tasks: Task[]) =>
	[...tasks]
		.map((task) => ({
			...task,
			assignees: [...(task.assignees ?? [])].sort((a, b) =>
				a.id.localeCompare(b.id),
			),
		}))
		.sort((a, b) => {
			const aOrder = a.project_task_number ?? Number.MAX_SAFE_INTEGER;
			const bOrder = b.project_task_number ?? Number.MAX_SAFE_INTEGER;
			if (aOrder !== bOrder) return aOrder - bOrder;
			return a.id.localeCompare(b.id);
		});

const areTasksEqual = (a: Task[], b: Task[]) =>
	JSON.stringify(normalizeTasksForCompare(a)) ===
	JSON.stringify(normalizeTasksForCompare(b));

const getErrorMessage = (error: unknown) => {
	if (
		typeof error === "object" &&
		error !== null &&
		"response" in error &&
		typeof (error as { response?: unknown }).response === "object" &&
		(error as { response?: { data?: { message?: string; error?: string } } })
			.response?.data
	) {
		const response = (error as {
			response?: { data?: { message?: string; error?: string } };
		}).response;
		return (
			response?.data?.message || response?.data?.error || "Error desconocido"
		);
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Error desconocido";
};

export const useTasks = (projectId: string) => {
	const [tasks, setTasks] = useState<Task[]>(() => readTasksCache(projectId));
	const [loading, setLoading] = useState(() => readTasksCache(projectId).length === 0);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async (showLoading = false) => {
		if (!projectId) return;

		try {
			if (showLoading) setLoading(true);
			const res = await api.get<Task[]>(`/api/tasks/${projectId}`);
			setTasks((prev) => (areTasksEqual(prev, res.data) ? prev : res.data));
			setError(null);
		} catch (err: unknown) {
			console.error("Error al cargar tareas:", err);
			setError(getErrorMessage(err));
		} finally {
			if (showLoading) setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		const cached = readTasksCache(projectId);
		if (cached.length > 0) {
			setTasks(cached);
			setLoading(false);
		} else {
			setLoading(true);
		}

		fetchData(cached.length === 0);
	}, [fetchData, projectId]);

	useEffect(() => {
		writeTasksCache(projectId, tasks);
	}, [projectId, tasks]);

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
		let previousTask: Task | undefined;

		setTasks((prev) => {
			previousTask = prev.find((task) => task.id === taskId);
			return prev.map((task) =>
				task.id === taskId ? { ...task, ...taskData } : task,
			);
		});

		try {
			const taskPayload: Record<string, unknown> = { ...taskData };
			if (taskData.assignees) {
				taskPayload.assignees = taskData.assignees.map((assignee) => assignee.id);
			}

			await api.put(`/api/tasks/${taskId}`, taskPayload);
			return true;
		} catch (err) {
			if (previousTask) {
				const taskToRestore = previousTask;
				setTasks((prev) =>
					prev.map((task) => (task.id === taskId ? taskToRestore : task)),
				);
			}
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
