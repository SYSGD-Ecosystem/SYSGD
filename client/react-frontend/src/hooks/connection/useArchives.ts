import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import axios from "axios";

const useArchives = () => {
    const [archives, setArchives] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/api/archives");
            console.log(data);
            setArchives(data);
            setError(null);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Error al obtener los archivos"
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

    return { archives, error, loading, reloadArchives: fetchData };
};

export default useArchives;
