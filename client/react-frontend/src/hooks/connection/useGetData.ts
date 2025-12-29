import { useEffect, useState } from "react";
import api from "@/lib/api"; // Tu instancia centralizada de Axios

// Definimos un tipo genérico T para que este hook sea reutilizable
export function useGetData<T = any>(id: string) {
    const [data, setData] = useState<T | []>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Evitamos peticiones si no hay ID
        if (!id) {
            setError("El código no puede estar vacío.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Axios maneja el encoding de los params automáticamente
                const response = await api.get<T>("/api/get_data", {
                    params: { id }
                });

                setData(response.data);
            } catch (err: any) {
                console.error("Error en useGetData:", err);
                setError(err.response?.data?.message || "Error al obtener los datos");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]); // Solo depende del ID, ya no del serverUrl

    return { data, error, loading };
}

export default useGetData;