import type { Idea } from "@/types/ProjectTypes";
import { useEffect, useState, useCallback } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const useIdeas = (project_id: string) => {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            if (!project_id) {
                throw new Error("El id no puede estar vacío.");
            }

            setLoading(true);
            const res = await fetch(`${serverUrl}/api/ideas/${project_id}`, {
                credentials: "include",
            });

            if (!res.ok) throw new Error("No se pudieron obtener las tareas");

            const data = await res.json();
            setIdeas(data);
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

    const createIdea = async (idea: Partial<Idea>) => {
        console.log(idea)
        try {
            const res = await fetch(`${serverUrl}/api/ideas/${project_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ...idea, projectId: project_id }),
            });

            if (!res.ok) throw new Error("Error al crear tarea");

            const newIdea = await res.json();
            setIdeas((prev) => [...prev, newIdea]);
            return true;
        } catch (err) {
            console.error("Error creando idea:", err);
            return false;
        }
    };

    const updateIdea = async (ideaId: string, ideaData: Partial<Idea>) => {
        try {
            const res = await fetch(`${serverUrl}/api/Ideas/${ideaId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(ideaData),
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

    const deleteIdea = async (ideaId: string) => {
        try {
            const res = await fetch(`${serverUrl}/api/ideas/${ideaId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Error al eliminar la tarea");

            // Actualizamos el estado local para reflejar la eliminación instantáneamente
            setIdeas((prevIdeas) => prevIdeas.filter((idea) => idea.id !== ideaId));
            return true;
        } catch (err) {
            console.error("Error eliminando tarea:", err);
            return false;
        }
    };

    return {
        ideas,
        loading,
        error,
        fetchData,
        createIdea,
        updateIdea,
        deleteIdea,
    };
};
