import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { RetentionScheduleData } from "../../types/RetentionSchedule";

// Definimos la estructura de la respuesta de la DB (columna JSONB)
interface RetentionResponse {
    retention_schedule: RetentionScheduleData[];
    [key: string]: any;
}

export const useGetRetentionSchedule = (archiveId: string) => {
    // Inicializamos con array vacío para evitar errores de mapeo en la UI
    const [schedule, setSchedule] = useState<RetentionScheduleData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!archiveId) {
            setSchedule([]);
            setLoading(false);
            return;
        }

        const fetchTRD = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get<RetentionResponse[]>("/api/get-retention-schedule", {
                    params: { id: archiveId }
                });

                // Replicamos tu lógica de filtrado y aplanamiento para ser fieles al componente
                const flatData = Array.isArray(response.data)
                    ? response.data
                        .filter((item) => Array.isArray(item.retention_schedule))
                        .flatMap((item) => item.retention_schedule)
                    : [];

                setSchedule(flatData);
            } catch (err: any) {
                console.error("Error cargando TRD:", err);
                setError(err.response?.data?.message || "Error al obtener la TRD");
                setSchedule([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTRD();
    }, [archiveId]);

    return { schedule, error, loading };
};

export default useGetRetentionSchedule;