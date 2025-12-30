import { useState } from "react";
import api from "@/lib/api"; // Tu instancia centralizada

interface CheckUserResponse {
    exists: boolean;
    id?: string;
    status?: "active" | "invited" | "suspended" | "banned";
    hasPassword?: boolean;
    privileges?: string;
}

export function useCheckUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [data, setData] = useState<CheckUserResponse | null>(null);

    const checkUser = async (email: string) => {
        setLoading(true);
        setError("");
        setData(null);
        try {
            // Axios maneja JSON y headers automáticamente
            const res = await api.post<CheckUserResponse>("/api/auth/check-user", { email });
            setData(res.data);
        } catch (e: any) {
            // En Axios, el 404 entra aquí. 
            // Esto es crucial: 404 significa "No existe", no es un error del sistema.
            if (e.response && e.response.status === 404) {
                setData({ exists: false });
            } else {
                // Cualquier otro error (500, Network Error, etc.)
                console.error("Error verificando usuario:", e);
                setError(e.response?.data?.message || "No se pudo verificar el usuario");
            }
        } finally {
            setLoading(false);
        }
    };

    return { checkUser, data, loading, error };
}