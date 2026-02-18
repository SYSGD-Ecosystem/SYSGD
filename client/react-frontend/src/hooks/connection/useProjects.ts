import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { PROJECTS_CACHE_KEY } from "@/utils/offline-access";

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

const normalizeProjectsForCompare = (data: Project[]) =>
	[...data].sort((a, b) => {
		const aDate = new Date(a.created_at ?? 0).getTime();
		const bDate = new Date(b.created_at ?? 0).getTime();
		if (aDate !== bDate) return bDate - aDate;
		return a.id.localeCompare(b.id);
	});

const areProjectsEqual = (a: Project[], b: Project[]) =>
	JSON.stringify(normalizeProjectsForCompare(a)) ===
	JSON.stringify(normalizeProjectsForCompare(b));

const useProjects = () => {
	const readProjectsCache = (): Project[] => {
		try {
			const raw = localStorage.getItem(PROJECTS_CACHE_KEY);
			if (!raw) return [];
			const parsed = JSON.parse(raw) as { projects?: Project[] };
			return Array.isArray(parsed.projects) ? parsed.projects : [];
		} catch {
			return [];
		}
	};

	const writeProjectsCache = (data: Project[]) => {
		localStorage.setItem(
			PROJECTS_CACHE_KEY,
			JSON.stringify({ projects: data, updatedAt: Date.now() }),
		);
	};

	const [projects, setProjects] = useState<Project[]>(() => readProjectsCache());
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(() => readProjectsCache().length === 0);

	const fetchData = useCallback(async (showLoading = false) => {
		if (showLoading) setLoading(true);
		try {
			const { data } = await api.get<Project[]>("/api/projects");
			setProjects((prev) => (areProjectsEqual(prev, data) ? prev : data));
			setError(null);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				setError(
					err.response?.data?.message || "Error al obtener los proyectos",
				);
			} else {
				setError("Error inesperado");
			}
		} finally {
			if (showLoading) setLoading(false);
		}
	}, []);

	useEffect(() => {
		const cached = readProjectsCache();
		if (cached.length > 0) {
			setProjects(cached);
			setLoading(false);
		} else {
			setLoading(true);
		}

		fetchData(cached.length === 0);
	}, [fetchData]);

	useEffect(() => {
		writeProjectsCache(projects);
	}, [projects]);

	return { projects, error, loading, reloadProjects: fetchData };
};

export default useProjects;
