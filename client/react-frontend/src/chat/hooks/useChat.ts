/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { useState, useEffect, useCallback, useRef } from "react";

type UUID = string;

export interface UserShort {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface Conversation {
  id: UUID;
  title?: string | null;
  type: "private" | "group" | "channel" | string;
  created_by?: string | null;
  created_at?: string;
  members?: UserShort[];
  last_message?: {
    id?: UUID;
    content?: string | null;
    sender_id?: string | null;
    created_at?: string | null;
  } | null;
  last_read_message_id?: UUID | null;
}

export interface Message {
  id: UUID;
  conversation_id: UUID;
  sender_id?: string | null;
  content?: string | null;
  attachment_type?: "image" | "audio" | "video" | "file" | string | null;
  attachment_url?: string | null;
  reply_to?: UUID | null;
  created_at?: string;
  sender_email?: string | null;
  sender_name?: string | null;
}

export interface Invitation {
  id: UUID;
  conversation_id: UUID;
  sender_id: string;
  receiver_email: string;
  status: "pending" | "accepted" | "declined" | string;
  created_at?: string;
  responded_at?: string | null;
  title?: string | null;
  type?: string | null;
  sender_email?: string | null;
}

/**
 * useChat - Hook TypeScript para gestionar conversaciones, mensajes e invitaciones
 *
 * - Usa import.meta.env.VITE_SERVER_URL o fallback http://localhost:3000
 * - **Todas** las llamadas usan credentials: "include" (necesario para sesiones/cookies)
 * - Expone funciones para manejar todo el flujo: conversaciones, mensajes, invitaciones y lectura
 */

export function useChat() {
  const serverUrl = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:3000";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllers = useRef<Record<string, AbortController>>({});

  /**
   * safeFetch - wrapper que aplica credentials: "include" por defecto y parsea JSON/texto.
   * Acepta init.signal para abort.
   */
  const safeFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      const mergedInit: RequestInit = {
        credentials: "include",
        ...init,
      };
      try {
        const res = await fetch(input, mergedInit);
        const text = await res.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
        if (!res.ok) {
          const msg = data?.error || data?.message || data || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        return data;
      } catch (err: any) {
        // pasamos el error hacia arriba con un formato consistente
        throw new Error(err?.message || "Network error");
      }
    },
    []
  );

  // -----------------------
  // Conversaciones
  // -----------------------
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetch(`${serverUrl}/api/chat/conversations`);
      setConversations(Array.isArray(data) ? data : []);
      return data;
    } catch (err: any) {
      setError(err.message || "Error al obtener conversaciones");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [serverUrl, safeFetch]);

  // -----------------------
  // Mensajes
  // -----------------------
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      setLoading(true);
      setError(null);

      // abort previo si existe
      if (abortControllers.current[conversationId]) {
        abortControllers.current[conversationId].abort();
      }
      const ac = new AbortController();
      abortControllers.current[conversationId] = ac;

      try {
        const data = await safeFetch(`${serverUrl}/api/chat/messages/${conversationId}`, {
          signal: ac.signal,
        } as RequestInit);
        setMessagesMap((prev) => ({ ...prev, [conversationId]: Array.isArray(data) ? data : [] }));
        return data;
      } catch (err: any) {
        if (err.name === "AbortError") {
          // petición cancelada, no actualizar estado de error
        } else {
          setError(err.message || "Error al obtener mensajes");
          throw err;
        }
      } finally {
        setLoading(false);
        delete abortControllers.current[conversationId];
      }
    },
    [serverUrl, safeFetch]
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      message: {
        content?: string;
        attachment_type?: string;
        attachment_url?: string;
        reply_to?: string | null;
      }
    ) => {
      if (!conversationId) throw new Error("conversationId requerido");
      setError(null);

      try {
        const payload = { conversation_id: conversationId, ...message };
        const newMessage = await safeFetch(`${serverUrl}/api/chat/messages/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        setMessagesMap((prev) => {
          const existing = prev[conversationId] ?? [];
          return { ...prev, [conversationId]: [...existing, newMessage] };
        });

        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, last_message: newMessage } : c))
        );

        return newMessage as Message;
      } catch (err: any) {
        setError(err.message || "Error al enviar mensaje");
        throw err;
      }
    },
    [serverUrl, safeFetch]
  );

  // -----------------------
  // Crear conversación
  // -----------------------
  type CreateOpts =
    | { contactemail?: string; members?: string[]; title?: string; type?: string }
    | string;

  const createConversation = useCallback(
    async (opts?: CreateOpts) => {
      setError(null);
      try {
        const body: any = {};
        if (typeof opts === "string") {
          body.contactemail = opts;
        } else if (opts && typeof opts === "object") {
          if (opts.contactemail) body.contactemail = opts.contactemail;
          if (opts.members) body.members = opts.members;
          if (opts.title) body.title = opts.title;
          if (opts.type) body.type = opts.type;
        }

        console.log("Creating conversation with body:", body);

        const newConv: Conversation = await safeFetch(`${serverUrl}/api/chat/conversations/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        setConversations((prev) => {
          if (prev.find((p) => p.id === newConv.id)) return prev;
          return [newConv, ...prev];
        });

        return newConv;
      } catch (err: any) {
        setError(err.message || "Error al crear conversación");
        throw err;
      }
    },
    [serverUrl, safeFetch]
  );

  // -----------------------
  // Invitaciones
  // -----------------------
  const sendInvitation = useCallback(
    async (conversation_id: string, receiver_email: string) => {
      setError(null);
      if (!conversation_id || !receiver_email) throw new Error("conversation_id y receiver_email requeridos");
      try {
        const inv: Invitation = await safeFetch(`${serverUrl}/api/chat/conversations/invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id, receiver_email }),
        });
        setInvitations((prev) => [inv, ...prev]);
        return inv;
      } catch (err: any) {
        setError(err.message || "Error al enviar invitación");
        throw err;
      }
    },
    [serverUrl, safeFetch]
  );

  const getInvitations = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await safeFetch(`${serverUrl}/api/chat/conversations/invitations`);
      setInvitations(Array.isArray(data) ? data : []);
      return data;
    } catch (err: any) {
      setError(err.message || "Error al obtener invitaciones");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [serverUrl, safeFetch]);

  const acceptInvitation = useCallback(
    async (invitation_id: string) => {
      setError(null);
      try {
        const res = await safeFetch(`${serverUrl}/api/chat/conversations/invite/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitation_id }),
        });

        setInvitations((prev) => prev.map((i) => (i.id === invitation_id ? { ...i, status: "accepted" } : i)));
        await fetchConversations();
        return res;
      } catch (err: any) {
        setError(err.message || "Error al aceptar invitación");
        throw err;
      }
    },
    [serverUrl, safeFetch, fetchConversations]
  );

  // -----------------------
  // Lectura de mensajes (mark as read)
  // -----------------------
  const markAsRead = useCallback(
    async (conversationId: string, last_read_message_id: string) => {
      setError(null);
      if (!conversationId || !last_read_message_id) throw new Error("conversationId y last_read_message_id requeridos");
      try {
        const res = await safeFetch(`${serverUrl}/api/chat/conversations/${conversationId}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ last_read_message_id }),
        });

        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, last_read_message_id } : c)));
        return res;
      } catch (err: any) {
        setError(err.message || "Error al marcar como leído");
        throw err;
      }
    },
    [serverUrl, safeFetch]
  );

  // -----------------------
  // Eliminar conversación
  // -----------------------
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      setError(null);
      if (!conversationId) throw new Error("conversationId requerido");
      try {
        await safeFetch(`${serverUrl}/api/chat/conversations/${conversationId}`, {
          method: "DELETE",
        });

        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        setMessagesMap((prev) => {
          const copy = { ...prev };
          delete copy[conversationId];
          return copy;
        });

        return true;
      } catch (err: any) {
        setError(err.message || "Error al eliminar conversación");
        throw err;
      }
    },
    [serverUrl, safeFetch]
  );

  // -----------------------
  // Utilidades y helpers
  // -----------------------
  const setMessagesForConversation = useCallback((conversationId: string, msgs: Message[]) => {
    setMessagesMap((prev) => ({ ...prev, [conversationId]: msgs }));
  }, []);

  /**
   * fetchCurrentUser - obtiene info del usuario autenticado (usa credentials include)
   * endpoint backend esperado: `${serverUrl}/api/auth/me`
   */
  const fetchCurrentUser = useCallback(async (): Promise<{ id: string; email: string; } | null> => {
    try {
      const data = await safeFetch(`${serverUrl}/api/auth/me`);
      return data || null;
    } catch {
      return null;
    }
  }, [serverUrl, safeFetch]);

  // cargar conversaciones al montar el hook
  useEffect(() => {
    fetchConversations().catch(() => {});
    // cleanup: abort any pending requests on unmount
    return () => {
      Object.values(abortControllers.current).forEach((ac) => {
        try {
          ac.abort();
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // estados
    conversations,
    messagesMap,
    invitations,
    loading,
    error,

    // conversation actions
    fetchConversations,
    createConversation,
    deleteConversation,

    // message actions
    fetchMessages,
    sendMessage,
    setMessagesForConversation,

    // invitations
    sendInvitation,
    getInvitations,
    acceptInvitation,

    // reads
    markAsRead,

    // helpers
    fetchCurrentUser,
  };
}
