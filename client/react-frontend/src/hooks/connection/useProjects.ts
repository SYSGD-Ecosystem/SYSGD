import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import axios from "axios";

export type Project = {
	id: string;
	name: string;
	description?: string;
	created_by?: string;
	created_at?: string;
	status?: string;
	visibility?: string;
	tipo: "project";

	members_count: number;
	total_tasks: number;
	completed_tasks: number;
};

const useProjects = () => {
	const [projects, setProjects] = useState<Project[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const { data } = await api.get<Project[]>("/api/projects");
			setProjects(data);
			setError(null);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				setError(
					err.response?.data?.message ||
						"Error al obtener los proyectos",
				);
			} else {
				setError("Error inesperado");
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return { projects, error, loading, reloadProjects: fetchData };
};

export default useProjects;
