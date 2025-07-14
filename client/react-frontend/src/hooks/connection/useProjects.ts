import { useState, useEffect, useCallback } from "react";


export type Project = {
	id: string;
	name: string;
	description?: string;
	created_by?: string;
	created_at?: string;
	status?: string;
	visibility?: string;
    tipo: "project"

    members_count: number;
	total_tasks: number;
	completed_tasks: number;
};


const useProjects = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${serverUrl}/api/projects`, {
                credentials: "include", // muy importante para que se manden las cookies de sesión
            });

            if (!response.ok) {
                throw new Error("Error al obtener los proyectos");
            }

            const data = await response.json();
            setProjects(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, [serverUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { projects, error, loading, reloadProjects: fetchData };
};

export default useProjects;
