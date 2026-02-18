import { useEffect, useState } from "react";
import api from "@/lib/api"; // Instancia centralizada
import { RegistroDeEntradaData } from "@/components/docs/RegistroDeEntrada";

// Definimos la estructura basada en tu columna entry_register JSONB


export function useGetEntryRegister(entryId: string) {
    const [entry, setEntry] = useState<RegistroDeEntradaData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Si no hay ID, no disparamos la petición
        if (!entryId) {
            setLoading(false);
            return;
        }

        const fetchEntry = async () => {
            setLoading(true);
            setError(null);
            try {
                // Usamos params de Axios para evitar concatenar strings manualmente
                const response = await api.get<RegistroDeEntradaData>("/api/get-document-entry", {
                    params: { id: entryId }
                });

                setEntry(response.data);
            } catch (err: any) {
                console.error("Error cargando registro de entrada:", err);
                setError(
                    err.response?.data?.message || 
                    "Error al obtener el registro de entrada"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchEntry();
    }, [entryId]);

    return { entry, error, loading };
}

export default useGetEntryRegister;