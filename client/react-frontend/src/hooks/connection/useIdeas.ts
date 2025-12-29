import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api"; // Tu instancia centralizada
import type { Idea } from "@/types/ProjectTypes";

export const useIdeas = (project_id: string) => {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        // Evitamos llamadas innecesarias si no hay ID
        if (!project_id) return;

        setLoading(true);
        setError(null);
        try {
            const res = await api.get<Idea[]>(`/api/ideas/${project_id}`);
            setIdeas(res.data);
        } catch (err: any) {
            console.error("Error al cargar ideas:", err);
            setError(err.response?.data?.message || "No se pudieron obtener las ideas");
        } finally {
            setLoading(false);
        }
    }, [project_id]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createIdea = async (idea: Partial<Idea>) => {
        try {
            // Enviamos el projectId tanto en la URL (si tu API lo usa así) como en el body por seguridad
            const payload = { ...idea, projectId: project_id };
            
            const res = await api.post<Idea>(`/api/ideas/${project_id}`, payload);
            
            // Actualización optimista: agregamos la nueva idea al estado sin recargar todo
            setIdeas((prev) => [...prev, res.data]);
            return true;
        } catch (err: any) {
            console.error("Error creando idea:", err);
            setError(err.response?.data?.message || "Error al crear la idea");
            return false;
        }
    };

    const updateIdea = async (ideaId: string, ideaData: Partial<Idea>) => {
        try {
            // CORRECCIÓN CRÍTICA: Cambiado '/api/Ideas/' a '/api/ideas/'
            // Linux es Case-Sensitive, 'Ideas' fallaría en producción.
            await api.put(`/api/ideas/${ideaId}`, ideaData);
            
            // Aquí recargamos para asegurar consistencia, 
            // pero podrías actualizar el estado local manualmente si prefieres velocidad.
            await fetchData();
            return true;
        } catch (err: any) {
            console.error("Error actualizando idea:", err);
            setError(err.response?.data?.message || "Error al actualizar la idea");
            return false;
        }
    };

    const deleteIdea = async (ideaId: string) => {
        try {
            await api.delete(`/api/ideas/${ideaId}`);

            // Actualizamos el estado local instantáneamente (Optimistic UI)
            setIdeas((prevIdeas) => prevIdeas.filter((idea) => idea.id !== ideaId));
            return true;
        } catch (err: any) {
            console.error("Error eliminando idea:", err);
            setError(err.response?.data?.message || "Error al eliminar la idea");
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