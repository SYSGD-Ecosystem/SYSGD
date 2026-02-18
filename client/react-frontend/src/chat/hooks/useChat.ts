/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

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

function getErrorMessage(err: any, fallback: string) {
	return (
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		fallback
	);
}

/**
 * useChat - Hook TypeScript para gestionar conversaciones, mensajes e invitaciones
 *
 * - Usa import.meta.env.VITE_SERVER_URL o fallback http://localhost:3000
 * - **Todas** las llamadas usan credentials: "include" (necesario para sesiones/cookies)
 * - Expone funciones para manejar todo el flujo: conversaciones, mensajes, invitaciones y lectura
 */

export function useChat() {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [loadingConversations, setLoadingConversations] =
		useState<boolean>(false);
	const [loadingMessagesMap, setLoadingMessagesMap] = useState<
		Record<string, boolean>
	>({});
	const [error, setError] = useState<string | null>(null);

	const abortControllers = useRef<Record<string, AbortController>>({});

	// -----------------------
	// Conversaciones
	// -----------------------

	const fetchConversations = useCallback(async () => {
		setLoadingConversations(true);
		setLoading(true);
		setError(null);
		try {
			const { data } = await api.get<Conversation[]>("/api/chat/conversations");
			setConversations(Array.isArray(data) ? data : []);
			return data;
		} catch (err: any) {
			const msg = getErrorMessage(err, "Error al obtener conversaciones");
			setError(msg);
			throw err;
		} finally {
			setLoading(false);
			setLoadingConversations(false);
		}
	}, []);

	// -----------------------
	// Mensajes
	// -----------------------

	const fetchMessages = useCallback(async (conversationId: string) => {
		if (!conversationId) return;

		setLoadingMessagesMap((prev) => ({ ...prev, [conversationId]: true }));
		setLoading(true);
		setError(null);

		if (abortControllers.current[conversationId]) {
			abortControllers.current[conversationId].abort();
		}

		const ac = new AbortController();
		abortControllers.current[conversationId] = ac;

		try {
			const { data } = await api.get<Message[]>(
				`/api/chat/messages/${conversationId}`,
				{ signal: ac.signal },
			);

			setMessagesMap((prev) => ({
				...prev,
				[conversationId]: Array.isArray(data) ? data : [],
			}));

			return data;
		} catch (err: any) {
			if (err.name !== "CanceledError") {
				const msg = getErrorMessage(err, "Error al obtener mensajes");
				setError(msg);
				throw err;
			}
		} finally {
			setLoading(false);
			setLoadingMessagesMap((prev) => ({ ...prev, [conversationId]: false }));
			delete abortControllers.current[conversationId];
		}
	}, []);

	const sendMessage = useCallback(
		async (conversationId: string, message: any) => {
			if (!conversationId) throw new Error("conversationId requerido");
			setError(null);

			try {
				const payload = { conversation_id: conversationId, ...message };

				const { data: newMessage } = await api.post<Message>(
					"/api/chat/messages/send",
					payload,
				);

				setMessagesMap((prev) => ({
					...prev,
					[conversationId]: [...(prev[conversationId] ?? []), newMessage],
				}));

				setConversations((prev) =>
					prev.map((c) =>
						c.id === conversationId ? { ...c, last_message: newMessage } : c,
					),
				);

				return newMessage;
			} catch (err: any) {
				const msg = getErrorMessage(err, "Error al enviar mensaje");
				setError(msg);
				throw err;
			}
		},
		[],
	);

	// -----------------------
	// Crear conversación
	// -----------------------
	type CreateOpts =
		| {
				contactemail?: string;
				members?: string[];
				title?: string;
				type?: string;
		  }
		| string;

	const createConversation = useCallback(async (opts?: CreateOpts) => {
		setError(null);
		try {
			const body: any =
				typeof opts === "string" ? { contactemail: opts } : (opts ?? {});

			const { data: newConv } = await api.post<Conversation>(
				"/api/chat/conversations/create",
				body,
			);

			setConversations((prev) =>
				prev.some((c) => c.id === newConv.id) ? prev : [newConv, ...prev],
			);

			return newConv;
		} catch (err: any) {
			const msg = getErrorMessage(err, "Error al crear conversación");
			setError(msg);
			throw err;
		}
	}, []);

	// -----------------------
	// Invitaciones
	// -----------------------

	const sendInvitation = useCallback(
		async (conversation_id: string, receiver_email: string) => {
			setError(null);

			if (!conversation_id || !receiver_email) {
				throw new Error("conversation_id y receiver_email requeridos");
			}

			try {
				const { data } = await api.post<Invitation>(
					"/api/chat/conversations/invite",
					{ conversation_id, receiver_email },
				);

				setInvitations((prev) => [data, ...prev]);
				return data;
			} catch (err: any) {
				const msg =
					err?.response?.data?.message || "Error al enviar invitación";
				setError(msg);
				throw err;
			}
		},
		[],
	);

	const getInvitations = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const { data } = await api.get<Invitation[]>(
				"/api/chat/conversations/invitations",
			);
			setInvitations(Array.isArray(data) ? data : []);
			return data;
		} catch (err: any) {
			const msg = getErrorMessage(err, "Error al obtener invitaciones");
			setError(msg);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const acceptInvitation = useCallback(
		async (invitation_id: string) => {
			setError(null);

			if (!invitation_id) {
				throw new Error("invitation_id requerido");
			}

			try {
				const { data } = await api.post(
					"/api/chat/conversations/invite/accept",
					{ invitation_id },
				);

				setInvitations((prev) =>
					prev.map((i) =>
						i.id === invitation_id ? { ...i, status: "accepted" } : i,
					),
				);

				await fetchConversations();
				return data;
			} catch (err: any) {
				const msg =
					err?.response?.data?.message || "Error al aceptar invitación";
				setError(msg);
				throw err;
			}
		},
		[fetchConversations],
	);

	// -----------------------
	// Lectura de mensajes (mark as read)
	// -----------------------

	const markAsRead = useCallback(
		async (conversationId: string, last_read_message_id: string) => {
			setError(null);

			if (!conversationId || !last_read_message_id) {
				throw new Error("conversationId y last_read_message_id requeridos");
			}

			try {
				const { data } = await api.post(
					`/api/chat/conversations/${conversationId}/read`,
					{ last_read_message_id },
				);

				setConversations((prev) =>
					prev.map((c) =>
						c.id === conversationId ? { ...c, last_read_message_id } : c,
					),
				);

				return data;
			} catch (err: any) {
				const msg =
					err?.response?.data?.message || "Error al marcar como leído";
				setError(msg);
				throw err;
			}
		},
		[],
	);

	// -----------------------
	// Eliminar conversación
	// -----------------------
	const deleteConversation = useCallback(async (conversationId: string) => {
		setError(null);

		if (!conversationId) {
			throw new Error("conversationId requerido");
		}

		try {
			await api.delete(`/api/chat/conversations/${conversationId}`);

			setConversations((prev) => prev.filter((c) => c.id !== conversationId));

			setMessagesMap((prev) => {
				const copy = { ...prev };
				delete copy[conversationId];
				return copy;
			});

			return true;
		} catch (err: any) {
			const msg =
				err?.response?.data?.message || "Error al eliminar conversación";
			setError(msg);
			throw err;
		}
	}, []);

	// -----------------------
	// Actualizar conversación
	// -----------------------
	const updateConversationTitle = useCallback(
		async (conversationId: string, title: string | null) => {
			setError(null);
			if (!conversationId) throw new Error("conversationId requerido");

			try {
				const { data } = await api.put<{ id: string; title: string | null }>(
					`/api/chat/conversations/${conversationId}`,
					{ title },
				);

				setConversations((prev) =>
					prev.map((c) => (c.id === conversationId ? { ...c, title: data.title } : c)),
				);

				return data;
			} catch (err: any) {
				const msg = getErrorMessage(err, "Error al actualizar conversación");
				setError(msg);
				throw err;
			}
		},
		[],
	);

	const addConversationMember = useCallback(
		async (conversationId: string, email: string) => {
			setError(null);
			if (!conversationId || !email) {
				throw new Error("conversationId y email requeridos");
			}

			try {
				const { data } = await api.post<{
					conversation_id: string;
					member: UserShort;
				}>(`/api/chat/conversations/${conversationId}/members`, { email });

				setConversations((prev) =>
					prev.map((c) => {
						if (c.id !== conversationId) return c;
						const exists =
							c.members?.some((m) => m.id === data.member.id) ?? false;
						return {
							...c,
							members: exists
								? c.members
								: [...(c.members ?? []), data.member],
						};
					}),
				);

				return data.member;
			} catch (err: any) {
				const msg = getErrorMessage(err, "Error al añadir miembro");
				setError(msg);
				throw err;
			}
		},
		[],
	);

	const removeConversationMember = useCallback(
		async (conversationId: string, userId: string) => {
			setError(null);
			if (!conversationId || !userId) {
				throw new Error("conversationId y userId requeridos");
			}

			try {
				await api.delete(
					`/api/chat/conversations/${conversationId}/members/${userId}`,
				);

				setConversations((prev) =>
					prev.map((c) =>
						c.id === conversationId
							? {
									...c,
									members: (c.members ?? []).filter((m) => m.id !== userId),
								}
							: c,
					),
				);

				return true;
			} catch (err: any) {
				const msg = getErrorMessage(err, "Error al eliminar miembro");
				setError(msg);
				throw err;
			}
		},
		[],
	);

	// -----------------------
	// Eliminar mensaje
	// -----------------------
	const deleteMessage = useCallback(
		async (conversationId: string, messageId: string) => {
			setError(null);

			if (!conversationId || !messageId) {
				throw new Error("conversationId y messageId requeridos");
			}

			try {
				await api.delete(`/api/chat/messages/${messageId}`);

				let nextList: Message[] = [];
				setMessagesMap((prev) => {
					const list = prev[conversationId] ?? [];
					nextList = list.filter((m) => String(m.id) !== String(messageId));
					return { ...prev, [conversationId]: nextList };
				});

				if (nextList) {
					setConversations((prev) =>
						prev.map((c) => {
							if (c.id !== conversationId) return c;
							if (c.last_message?.id !== messageId) return c;
							const last = nextList[nextList.length - 1];
							return {
								...c,
								last_message: last
									? {
											id: last.id,
											content: last.content ?? null,
											sender_id: last.sender_id ?? null,
											created_at: last.created_at ?? null,
										}
									: null,
							};
						}),
					);
				}

				return true;
			} catch (err: any) {
				const msg = getErrorMessage(err, "Error al eliminar mensaje");
				setError(msg);
				throw err;
			}
		},
		[],
	);

	// -----------------------
	// Utilidades y helpers
	// -----------------------
	const setMessagesForConversation = useCallback(
		(conversationId: string, msgs: Message[]) => {
			setMessagesMap((prev) => ({ ...prev, [conversationId]: msgs }));
		},
		[],
	);

	const fetchCurrentUser = useCallback(async () => {
		try {
			const { data } = await api.get("/api/auth/me");
			return data ?? null;
		} catch {
			return null;
		}
	}, []);

	// cargar conversaciones al montar el hook
	useEffect(() => {
		fetchConversations().catch(() => {});
		// cleanup: abort any pending requests on unmount
		return () => {
			Object.values(abortControllers.current).forEach((ac) => {
				try {
					ac.abort();
				} catch {
					console.log("Error al cargar conversaciones");
				}
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
		loadingConversations,
		loadingMessagesMap,
		error,

		// conversation actions
		fetchConversations,
		createConversation,
		deleteConversation,
		updateConversationTitle,
		addConversationMember,
		removeConversationMember,

		// message actions
		fetchMessages,
		sendMessage,
		deleteMessage,
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
