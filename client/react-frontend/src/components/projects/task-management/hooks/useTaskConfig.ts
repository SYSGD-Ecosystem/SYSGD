/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

// --- Interfaces se mantienen igual ---
export interface TaskType {
	name: string;
	color: string;
}
export interface TaskPriority {
	name: string;
	level: number;
	color: string;
}
export interface TaskState {
	name: string;
	color: string;
	requires_context: boolean;
}
export interface TaskConfig {
	types: TaskType[];
	priorities: TaskPriority[];
	states: TaskState[];
}

export function useTaskConfig(projectId: string) {
	const [config, setConfig] = useState<TaskConfig | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// GET: Obtener configuración
	const fetchConfig = useCallback(async () => {
		if (!projectId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await api.get<TaskConfig>(
				`/api/projects/${projectId}/task-config`,
			);
			setConfig(res.data);
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al obtener configuración");
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	// PUT: Actualizar configuración completa
	const updateConfig = useCallback(
		async (newConfig: TaskConfig) => {
			if (!projectId) return false;
			setLoading(true);
			try {
				const res = await api.put<TaskConfig>(
					`/api/projects/${projectId}/task-config`,
					{
						task_config: newConfig,
					},
				);
				setConfig(res.data);
				return true;
			} catch {
				return false;
			} finally {
				setLoading(false);
			}
		},
		[projectId],
	);

	// --- Helper genérico para POST/DELETE (Abstracción interna para reducir código) ---
	const modifySubConfig = async (
		path: string,
		method: "post" | "delete",
		data?: any,
	) => {
		if (!projectId) return false;
		try {
			const res = await api[method]<TaskConfig>(
				`/api/projects/${projectId}/task-config/${path}`,
				data,
			);
			setConfig(res.data);
			return true;
		} catch {
			return false;
		}
	};

	// Métodos específicos utilizando el helper
	const addType = (type: TaskType) => modifySubConfig("types", "post", type);
	const removeType = (typeName: string) =>
		modifySubConfig(`types/${typeName}`, "delete");

	const addState = (state: TaskState) =>
		modifySubConfig("states", "post", state);
	const removeState = (stateName: string) =>
		modifySubConfig(`states/${stateName}`, "delete");

	const addPriority = (priority: TaskPriority) =>
		modifySubConfig("priorities", "post", priority);
	const removePriority = (priorityName: string) =>
		modifySubConfig(`priorities/${priorityName}`, "delete");

	useEffect(() => {
		fetchConfig();
	}, [fetchConfig]);

	return {
		config,
		loading,
		error,
		fetchConfig,
		updateConfig,
		addType,
		removeType,
		addState,
		removeState,
		addPriority,
		removePriority,
	};
}
