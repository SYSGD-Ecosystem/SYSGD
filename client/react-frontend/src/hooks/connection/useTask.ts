import type { Task } from "@/types/Task";
import { useEffect, useState, useCallback } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const useTasks = (project_id: string) => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		try {
			if (!project_id) {
				throw new Error("El id no puede estar vacío.");
			}

			setLoading(true);
			const res = await fetch(`${serverUrl}/api/tasks/${project_id}`, {
				credentials: "include",
			});

			if (!res.ok) throw new Error("No se pudieron obtener las tareas");

			const data = await res.json();
			setTasks(data);
			console.log(data);
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			console.error("Error al cargar tareas:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [project_id]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const createTask = async (task: Partial<Task>) => {
		try {
			const res = await fetch(`${serverUrl}/api/tasks`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ ...task, project_id: project_id }),
			});

			if (!res.ok) throw new Error("Error al crear tarea");

			const newTask = await res.json();
			setTasks((prev) => [...prev, newTask]);
			return true;
		} catch (err) {
			console.error("Error creando tarea:", err);
			return false;
		}
	};

	const updateTask = async (taskId: string, taskData: Partial<Task>) => {
		try {
			const res = await fetch(`${serverUrl}/api/tasks/${taskId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(taskData),
			});
			if (!res.ok) throw new Error("Error al actualizar la tarea");

			// Para ver el cambio reflejado, volvemos a cargar los datos
			await fetchData();
			return true;
		} catch (err) {
			console.error("Error actualizando tarea:", err);
			return false;
		}
	};

	const deleteTask = async (taskId: string) => {
		try {
			const res = await fetch(`${serverUrl}/api/tasks/${taskId}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) throw new Error("Error al eliminar la tarea");

			// Actualizamos el estado local para reflejar la eliminación instantáneamente
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
