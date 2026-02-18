import { useCallback, useState } from "react";
import api from "@/lib/api"; // Tu instancia centralizada

export type Invitation = {
    id: string;
    resource_type: "project" | "archive";
    resource_id: string;
    sender_id: string;
    receiver_id: string;
    status: "pending" | "accepted" | "rejected";
    permissions: "read" | "write" | "admin";
    created_at: string;
    sender_name: string;
    role: string;
};

export function useGetInvitations() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInvitations = useCallback(async () => {
        setLoading(true);
        setError(null); // Limpiamos errores previos al reintentar
        try {
            // Tipamos la respuesta directamente aquí
            const res = await api.get<Invitation[]>("/api/invitations");
            setInvitations(res.data);
        } catch (err: any) {
            console.error("Error cargando invitaciones:", err);
            // Capturamos el mensaje del backend si existe
            setError(err.response?.data?.message || "Error al obtener invitaciones");
        } finally {
            setLoading(false);
        }
    }, []); // Array de dependencias vacío real, sin trucos de linter

    return {
        invitations,
        loading,
        error,
        fetchInvitations,
    };
}