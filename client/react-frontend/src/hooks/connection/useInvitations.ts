import { useState, useCallback } from "react";

type Invitation = {
  id: string;
  resource_type: "project" | "archive";
  resource_id: string;
  sender_id: number;
  receiver_id: number;
  status: "pending" | "accepted" | "rejected";
  permissions: "read" | "write" | "admin";
  created_at: string;
};

export function useInvitations() {
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const sendInvitation = useCallback(
    async (
      receiverEmail: string,
      resource_type: "project" | "archive",
      resource_id: string,
      permissions: "read" | "write" | "admin" = "read"
    ) => {
      try {
        const res = await fetch(`${serverUrl}/api/invitations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            receiver_email: receiverEmail,
            resource_type,
            resource_id,
            permissions,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Error al enviar invitación");
        }
        await fetchInvitations(); // refrescar invitaciones
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [fetchInvitations, serverUrl]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const respondToInvitation = useCallback(
    async (invitationId: string, response: "accepted" | "rejected") => {
      try {
        const res = await fetch(
          `${serverUrl}/api/invitations/${invitationId}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ response }),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Error al responder la invitación");
        }

        await fetchInvitations(); // refrescar después de aceptar/rechazar
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [fetchInvitations, serverUrl]
  );

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    respondToInvitation,
  };
}
