import { useState, useEffect, useCallback } from "react";

const useArchives = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    const [archives, setArchives] = useState([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${serverUrl}/api/archives`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Error al obtener los datos");
            }
            const data = await response.json();
            setArchives(data);
            setError(null);
        } catch (error) {
            setError(JSON.stringify(error));
        } finally {
            setLoading(false);
        }
    }, [serverUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { archives, error, loading, reloadArchives: fetchData };
};

export default useArchives;
