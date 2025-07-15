import { useState, useCallback } from "react";

export type Invitation = {
  id: string;
  resource_type: "project" | "archive";
  resource_id: string;
  sender_id: number;
  receiver_id: number;
  status: "pending" | "accepted" | "rejected";
  permissions: "read" | "write" | "admin";
  created_at: string;
  sender_name: string;
  role: string
};

export function useGetInvitations() {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/invitations`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al obtener invitaciones");
      const data = await res.json();
      setInvitations(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);


  return {
    invitations,
    loading,
    error,
    fetchInvitations,
  };
}
