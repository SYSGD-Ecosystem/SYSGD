import { useState, useEffect } from "react";

const useGetEntryRegister = (entryId: string) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const [entry, setEntry] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        const fetchEntry = async () => {
            try {
                if (!entryId) {
                    throw new Error("El ID de la entrada no puede estar vacío.");
                }

                const response = await fetch(
                    `${serverUrl}/api/get-document-entry?id=${encodeURIComponent(entryId)}`,
                    { credentials: "include" }
                );

                if (!response.ok) {
                    throw new Error("Error al obtener el registro de entrada");
                }

                const data = await response.json();
                console.log(data)
                setEntry(data);
                setError(null);
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Error desconocido");
            } finally {
                setLoading(false);
            }
        };

        fetchEntry();
    }, [entryId, serverUrl]);

    return { entry, error, loading };
};

export default useGetEntryRegister;