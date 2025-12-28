import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function useUserCount() {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<null | string>(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await api.get<{ count: number }>("/api/user-count");
                setCount(res.data.count);
            } catch (err: unknown) {
                // Axios guarda el mensaje en err.message o err.response.data
                setError((err as Error).message || "Error al obtener la cantidad");
            } finally {
                setLoading(false);
            }
        };

        fetchCount();
    }, []);

    return { count, loading, error };
}