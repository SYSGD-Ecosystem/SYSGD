import { useInvitations } from "@/hooks/connection/useInvitations";
import { useEffect } from "react";


export default function InvitationsPanel() {
  const {
    invitations,
    loading,
    error,
    fetchInvitations,
    respondToInvitation,
  } = useInvitations();

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleResponse = async (id: string, action: "accepted" | "rejected") => {
    const success = await respondToInvitation(id, action);
    if (success) {
      alert(`Invitación ${action === "accepted" ? "aceptada" : "rechazada"} correctamente.`);
    }
  };

  if (loading) return <p className="p-4">Cargando invitaciones...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  if (invitations.length === 0)
    return <p className="p-4 text-gray-500">No tienes invitaciones pendientes.</p>;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-2 text-white">Invitaciones recibidas</h2>
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="bg-slate-800 text-white rounded-lg shadow-md p-4 flex flex-col gap-2 border border-slate-700"
        >
          <p>
            <strong>De:</strong> Usuario #{inv.sender_id}
          </p>
          <p>
            <strong>Recurso:</strong> {inv.resource_type} → ID: {inv.resource_id}
          </p>
          <p>
            <strong>Permiso:</strong> {inv.permissions}
          </p>
          <div className="flex gap-4 mt-2">
            {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
              className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded"
              onClick={() => handleResponse(inv.id, "accepted")}
            >
              Aceptar
            </button>
            {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
              className="px-4 py-1 bg-red-600 hover:bg-red-700 rounded"
              onClick={() => handleResponse(inv.id, "rejected")}
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
