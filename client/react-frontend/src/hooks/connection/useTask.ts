import type { Task } from "@/types/Task";
import { useEffect, useState, useCallback } from "react";



const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const useTasks = (project_id: string) => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
			console.log(data)
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			console.error("Error al cargar tareas:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [serverUrl]);

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

	return { tasks, loading, error, fetchData, createTask };
};
